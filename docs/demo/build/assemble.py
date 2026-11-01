import json, subprocess, re
from pathlib import Path
M=json.load(open('marks.json'))['marks']; REC=str(next(Path('rec').glob('*.webm')))
BG='0x0b3d36'; FPS=30
def run(c): subprocess.run(c,check=True)
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
Path('clips').mkdir(exist_ok=True)
def card(name,img,d):
    out=f'clips/{name}.mp4'
    run(['ffmpeg','-v','error','-y','-loop','1','-t',str(d),'-i',img,'-vf',f'fps={FPS},format=yuv420p,fade=in:st=0:d=0.4','-c:v','libx264','-crf','18','-preset','medium',out]); return out
def rec(name,a,b,d,extra=''):
    out=f'clips/{name}.mp4'; seg=b-a; pad=max(0,d-seg)
    vf=(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS,fps={FPS},scale=1632:918,tpad=stop_mode=clone:stop_duration={pad}[v];"
        f"color=c={BG}:s=1920x1080:r={FPS}:d={d}[bg];[bg][v]overlay=144:12:shortest=1{extra},format=yuv420p")
    run(['ffmpeg','-v','error','-y','-i',REC,'-filter_complex',vf,'-t',str(d),'-c:v','libx264','-crf','18','-preset','medium',out]); return out
# scenes: (clips, [(vo, offset)])
S=[]
S.append(([card('c1a','cards/c1a.png',5),card('c1b','cards/c1b.png',9.5)],[('s1',5.0)]))
S.append(([rec('s2',M['s2_start'],M['s2_end']-0.4,15,",drawbox=x=480:y=48:w=300:h=29:color=0xffc439:t=4:enable='gte(t,7.5)'")],[('s2',0.8)]))
S.append(([rec('s3',M['s3_start'],M['s3_end'],17)],[('s3',0.5)]))
S.append(([rec('s4',M['s4_start'],M['s4_end'],14)],[('s4',0.5)]))
S.append(([rec('s5',M['s5_start'],M['s5_end2'],10.5)],[('s5',0.5)]))
S.append(([rec('s6',M['s6a_start'],M['s6b_end'],26)],[('s6a',0.5),('s6b',M['s6b_start']-M['s6a_start']+0.2)]))
S.append(([card('c7a','cards/c7a.png',6),card('c7b','cards/c7b.png',6),card('c7c','cards/c7c.png',6.5)],[('s7',0.8)]))
S.append(([card('c8a','cards/c8a.png',7),card('c8b','cards/c8b.png',7)],[('s8',0.5)]))
clips=[]; vos=[]; t=0; subs=[]
def ts(x): h=int(x//3600); m=int(x%3600//60); s=x%60; return f"{h}:{m:02d}:{s:05.2f}"
for cl,vo in S:
    for f,o in vo:
        vos.append((f'vo/{f}.mp3',t+o))
        for blk in Path(f'vo/{f}.srt').read_text().strip().split('\n\n'):
            ln=blk.splitlines(); a,b=[sum(float(p.replace(',','.'))*k for p,k in zip(x.strip().split(':'),[3600,60,1])) for x in ln[1].split('-->')]
            words=' '.join(ln[2:]).split(); n=max(1,-(-len(words)//9)); per=-(-len(words)//n)
            chunks=[words[i:i+per] for i in range(0,len(words),per)]; tot=sum(len(' '.join(c)) for c in chunks); x=a
            for c in chunks:
                d=(b-a)*len(' '.join(c))/tot; subs.append((t+o+x,t+o+x+d,' '.join(c))); x+=d
    for c in cl: clips.append(c); t+=dur(c)
total=t; print('total',total)
Path('list.txt').write_text(''.join(f"file '{c}'\n" for c in clips))
run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','list.txt','-c','copy','video.mp4'])
# audio mix
inp=[]; fl=[]
for i,(f,o) in enumerate(vos):
    inp+=['-i',f]; fl.append(f"[{i}:a]aresample=48000,adelay={int(o*1000)}:all=1[a{i}]")
fl.append(''.join(f'[a{i}]' for i in range(len(vos)))+f"amix=inputs={len(vos)}:normalize=0,apad=whole_dur={total},loudnorm=I=-16:TP=-1.5[out]")
run(['ffmpeg','-v','error','-y',*inp,'-filter_complex',';'.join(fl),'-map','[out]','-t',str(total),'-ar','48000','-c:a','aac','-b:a','192k','audio.m4a'])
ass="""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Albert Sans,38,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,0,1,2,220,220,34,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
for a,b,x in subs: ass+=f"Dialogue: 0,{ts(a)},{ts(min(b,total))},Default,,0,0,0,,{x}\n"
Path('captions.ass').write_text(ass)
out='/workspace/income/top3-hackathon/paypal-invoice-agent/docs/demo/demo-final.mp4'
run(['ffmpeg','-v','error','-y','-i','video.mp4','-i','audio.m4a','-vf','ass=captions.ass:fontsdir=/usr/share/fonts','-c:v','libx264','-crf','20','-preset','medium','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart','-shortest',out])
print('done',dur(out))
