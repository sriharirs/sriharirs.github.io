import json
import base64

with open("mydata.json","r") as f:
    data = json.load(f)

    for i,d in enumerate(data):
        if 'record_video_data' in d:
            video = base64.b64decode(d['record_video_data'])
            with open("video_"+str(i)+".mp4","w+b") as v:
                v.write(video)
            