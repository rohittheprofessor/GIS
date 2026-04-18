import ee
import argparse
import base64
import requests
import sys
import json
import os

def parse_args():
    parser = argparse.ArgumentParser(description='Fetch GEE Image')
    parser.add_argument('--lon', type=float, required=True, help='Longitude')
    parser.add_argument('--lat', type=float, required=True, help='Latitude')
    parser.add_argument('--scale', type=float, required=True, help='Scale in meters')
    parser.add_argument('--start', type=str, required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end', type=str, required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--source', type=str, required=True, help='Satellite source (e.g., sentinel2, landsat8)')
    parser.add_argument('--mode', type=str, default='thumbnail', choices=['thumbnail', 'map', 'video', 'download'])
    parser.add_argument('--index', type=str, default='truecolor', choices=['truecolor', 'falsecolor', 'ndvi', 'ndwi'])
    parser.add_argument('--project', type=str, help='GCP Project ID for Earth Engine billing')
    parser.add_argument('--mock', action='store_true', help='Use mock image instead of GEE')
    return parser.parse_args()

def get_mock_result(mode):
    if mode == 'thumbnail':
        placeholder = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkOHrwAAH2A/2F8mF2AAAAAElFTkSuQmCC"
        print(json.dumps({"type": "thumbnail", "data": f"data:image/png;base64,{placeholder}"}))
    elif mode == 'map':
        print(json.dumps({"type": "mapid", "urlFormat": "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}))
    elif mode == 'video':
         print(json.dumps({"type": "video", "url": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif"}))
    elif mode == 'download':
        print(json.dumps({"type": "download", "url": "#mock-download"}))
    sys.exit(0)

def main():
    args = parse_args()
    
    if args.mock:
        get_mock_result(args.mode)

    try:
        service_account_json = os.environ.get('EE_SERVICE_ACCOUNT_JSON')
        if service_account_json:
            import google.oauth2.service_account
            json_creds = json.loads(service_account_json)
            # Fix potential escaped newlines caused by env variable stringification
            if 'private_key' in json_creds:
                json_creds['private_key'] = json_creds['private_key'].replace('\\n', '\n')
            credentials = google.oauth2.service_account.Credentials.from_service_account_info(json_creds)
            scopes = ['https://www.googleapis.com/auth/earthengine', 'https://www.googleapis.com/auth/cloud-platform']
            scoped_credentials = credentials.with_scopes(scopes)
            # Use provided project arg or fallback to the one in the service account JSON
            project_id = args.project or json_creds.get('project_id')
            if project_id:
                project_id = project_id.strip()
            ee.Initialize(scoped_credentials, project=project_id)
        else:
            if args.project:
                ee.Initialize(project=args.project)
            else:
                ee.Initialize()
    except Exception as e:
        print(json.dumps({"error": f"Earth Engine not initialized. {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    try:
        point = ee.Geometry.Point([args.lon, args.lat])
        region = point.buffer(args.scale * 100).bounds()
        
        # Source differences
        if args.source == 'sentinel2':
            collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
            cloud_property = 'CLOUDY_PIXEL_PERCENTAGE'
            b_red, b_green, b_blue, b_nir = 'B4', 'B3', 'B2', 'B8'
            true_min, true_max = 0, 3000
        elif args.source == 'landsat8':
            collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
            cloud_property = 'CLOUD_COVER'
            b_red, b_green, b_blue, b_nir = 'SR_B4', 'SR_B3', 'SR_B2', 'SR_B5'
            true_min, true_max = 7273, 18181
        else:
            raise ValueError(f"Unsupported source: {args.source}")

        # Filter collection
        filtered = collection.filterBounds(region) \
            .filterDate(args.start, args.end) \
            .filter(ee.Filter.lt(cloud_property, 20))
            
        def add_indices(image):
            ndvi = image.normalizedDifference([b_nir, b_red]).rename('NDVI')
            ndwi = image.normalizedDifference([b_green, b_nir]).rename('NDWI')
            return image.addBands(ndvi).addBands(ndwi)
            
        filtered = filtered.map(add_indices)
        
        # Determine Visualization base on --index
        if args.index == 'truecolor':
            bands = [b_red, b_green, b_blue]
            min_val, max_val = true_min, true_max
            palette = None
        elif args.index == 'falsecolor':
            bands = [b_nir, b_red, b_green]
            min_val, max_val = true_min, true_max
            palette = None
        elif args.index == 'ndvi':
            bands = ['NDVI']
            min_val, max_val = -0.5, 0.9
            palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901', '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01', '012E01', '011D01', '011301']
        elif args.index == 'ndwi':
            bands = ['NDWI']
            min_val, max_val = -0.5, 0.5
            palette = ['00FFFF', '0000FF']

        vis_params = {
            'bands': bands,
            'min': min_val,
            'max': max_val,
        }
        if palette:
            vis_params['palette'] = palette

        # mode handling
        if args.mode == 'video':
            vid_params = vis_params.copy()
            vid_params['region'] = region
            vid_params['scale'] = args.scale
            vid_params['framesPerSecond'] = 2
            vid_collection = filtered.limit(20)
            try:
                url = vid_collection.getVideoThumbURL(vid_params)
                print(json.dumps({"type": "video", "url": url}))
            except Exception as e:
                raise Exception(f"Video generation failed: {e}")

        else:
            image = filtered.median().clip(region)
            if args.mode == 'thumbnail':
                thumb_params = vis_params.copy()
                thumb_params['region'] = region
                thumb_params['scale'] = args.scale
                thumb_params['format'] = 'png'
                
                thumb_url = image.getThumbURL(thumb_params)
                response = requests.get(thumb_url)
                response.raise_for_status()
                img_base64 = base64.b64encode(response.content).decode('utf-8')
                print(json.dumps({"type": "thumbnail", "data": f"data:image/png;base64,{img_base64}"}))

            elif args.mode == 'map':
                map_id = image.getMapId(vis_params)
                try:
                    url_fmt = map_id['tile_fetcher'].url_format
                except AttributeError:
                    # Older earthengine-api
                    url_fmt = map_id['tile_fetcher'].urlFormat
                print(json.dumps({"type": "mapid", "urlFormat": url_fmt}))
                
            elif args.mode == 'download':
                dl_params = {
                    'name': 'gee_export',
                    'scale': args.scale,
                    'region': region,
                    'format': 'GEO_TIFF'
                }
                dl_url = image.select(bands).getDownloadURL(dl_params)
                print(json.dumps({"type": "download", "url": dl_url}))

    except Exception as e:
        print(json.dumps({"error": f"Error: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
