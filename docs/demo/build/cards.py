import html, re
from pathlib import Path
from pygments import highlight
from pygments.lexers import TypeScriptLexer
from pygments.formatters import HtmlFormatter
from playwright.sync_api import sync_playwright
P=Path('/workspace/income/top3-hackathon/paypal-invoice-agent')
BG="#0b3d36"
base=f"""<style>
*{{box-sizing:border-box;margin:0}} body{{width:1920px;height:1080px;background:{BG};color:#fff;font-family:'Albert Sans',sans-serif;overflow:hidden;position:relative}}
.area{{position:absolute;left:0;top:0;width:1920px;height:930px;display:flex;flex-direction:column;align-items:center;justify-content:center}}
.kicker{{font-size:30px;letter-spacing:4px;text-transform:uppercase;color:#7fe0b4;font-weight:600}}
h1{{font-size:120px;font-weight:800;letter-spacing:-2px}} h2{{font-size:60px;font-weight:700}}
.sub{{font-size:40px;opacity:.85;margin-top:18px}}
.pill{{display:inline-block;border:2px solid #7fe0b4;color:#7fe0b4;border-radius:40px;padding:10px 26px;font-size:28px;margin:30px 10px 0}}
.panel{{background:#0f1720;border-radius:18px;padding:36px 44px;box-shadow:0 20px 60px #0007}}
.title{{position:absolute;top:44px;left:0;width:100%;text-align:center}}
</style>"""
cards={}
cards['c1a']=base+"""<div class=area><div class=kicker>PayPal AI Hackathon</div><h1 style="margin-top:20px">ENSIDEX Invoice Agent</h1>
<div class=sub>Chat-to-cash invoicing for freelancers · English &amp; العربية</div>
<div><span class=pill>PayPal Invoicing v2</span><span class=pill>PayPal Orders v2</span><span class=pill>AI tool calling</span></div></div>"""
bub=lambda t,me=False: f'<div style="align-self:{"flex-end" if me else "flex-start"};background:{"#d9fdd3" if me else "#fff"};color:#111;border-radius:16px;padding:14px 20px;font-size:28px;max-width:80%;box-shadow:0 1px 2px #0003">{t}</div>'
cards['c1b']=base+f"""<div class=area style="flex-direction:row;gap:120px">
<div style="width:520px;height:860px;border-radius:56px;background:#111;padding:22px;box-shadow:0 30px 80px #0008"><div style="width:100%;height:100%;border-radius:38px;background:#efeae2;display:flex;flex-direction:column;gap:16px;padding:28px 22px;overflow:hidden">
<div style="background:#075e54;color:#fff;margin:-28px -22px 10px;padding:22px;font-size:26px;font-weight:700">Client chat</div>
{bub("Hi! Did you send the invoice?")}{bub("Not yet, I'll do it tonight",True)}{bub("Can you send it again? I can't find it")}{bub("Which email should I use?",True)}{bub("Any update on the invoice? 🙏")}{bub("On it…",True)}</div></div>
<div style="max-width:820px"><h2 style="font-size:72px;line-height:1.15">Freelancers live in chat.</h2><div class=sub style="font-size:44px">Invoicing still means dashboards and forms.</div>
<div class=sub style="font-size:44px;color:#7fe0b4;margin-top:40px;font-weight:700">What if billing were just a message?</div>
<div style="font-size:22px;opacity:.6;margin-top:40px">Illustration · fictional conversation</div></div></div>"""
src=(P/'server/tools.ts').read_text()
code=src[src.index('export async function runTool'):]
hl=highlight(code,TypeScriptLexer(),HtmlFormatter(style='monokai',nowrap=True))
css=HtmlFormatter(style='monokai').get_style_defs('.code')
cards['c7a']=base+f"""<style>{css} .code{{background:none;font-family:'IBM Plex Mono',monospace;font-size:18px;line-height:1.4;white-space:pre-wrap;word-break:break-all;width:1700px;color:#f8f8f2}}</style>
<div class=title><div class=kicker>server/tools.ts</div><h2 style="margin-top:8px">The agent's PayPal tools</h2></div>
<div class=area style="padding-top:150px"><div class="panel"><div class=code>{hl}</div></div></div>"""
arch=(P/'docs/architecture.md').read_text()
mer=re.search(r"```mermaid\n(.*?)```",arch,re.S).group(1)
cards['c7b']=base+f"""<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<div class=title><div class=kicker>docs/architecture.md</div><h2 style="margin-top:8px">Architecture</h2></div>
<div class=area style="padding-top:150px"><div style="background:#fff;border-radius:18px;padding:30px 40px"><pre class=mermaid style="font-family:'Albert Sans'">{html.escape(mer)}</pre></div></div>
<script>mermaid.initialize({{startOnLoad:true,theme:'default',themeVariables:{{fontFamily:'Albert Sans',fontSize:'20px'}},flowchart:{{htmlLabels:true,useMaxWidth:false}}}}); setTimeout(()=>{{const s=document.querySelector('.mermaid svg'); const w=s.getBBox().width; s.setAttribute('width',1700); s.removeAttribute('height'); s.style.maxWidth='none'; s.style.width='1700px'; s.style.height='auto';}},1500);</script>"""
t=Path('/tmp/npmtest.txt').read_text().strip()
t=t.replace(str(P),'~/ensidex-invoice-agent')
def color(l):
    e=html.escape(l)
    if '✓' in l: return '<span style="color:#7ee787">'+e+'</span>'
    if 'passed' in l: return '<span style="color:#7ee787;font-weight:600">'+e+'</span>'
    return e
term="\n".join(color(l) for l in t.splitlines())
cards['c7c']=base+f"""<div class=title><div class=kicker>Terminal</div><h2 style="margin-top:8px">npm test</h2></div>
<div class=area style="padding-top:150px"><div class=panel style="width:1720px;padding:0;overflow:hidden">
<div style="background:#1f2937;padding:14px 20px;display:flex;gap:10px"><span style="width:16px;height:16px;border-radius:50%;background:#ff5f56"></span><span style="width:16px;height:16px;border-radius:50%;background:#ffbd2e"></span><span style="width:16px;height:16px;border-radius:50%;background:#27c93f"></span></div>
<pre style="font-family:'IBM Plex Mono','Vazirmatn',monospace;font-size:22px;line-height:1.5;padding:30px 40px;color:#e5e7eb"><span style="color:#7fe0b4">$</span> npm test -- --reporter=verbose
{term}</pre></div></div>"""
cards['c8a']=base+"""<div class=area><div class=kicker>Open source · MIT License</div><h2 style="margin:20px 0 40px;font-size:72px">Run it with one Docker command</h2>
<div class=panel style="width:1400px"><pre style="font-family:'IBM Plex Mono',monospace;font-size:32px;line-height:1.7;color:#e5e7eb"><span style="color:#7fe0b4">$</span> docker build -t ensidex-invoice-agent .
<span style="color:#7fe0b4">$</span> docker run -p 8787:8787 --env-file .env ensidex-invoice-agent
<span style="color:#8b949e"># no keys? it still runs: offline parser + mock PayPal</span></pre></div></div>"""
cards['c8b']=base+"""<div class=area><h1 style="font-size:100px">ENSIDEX Invoice Agent</h1><div class=sub style="font-size:46px;color:#7fe0b4;font-weight:600">Say who owes you, and get paid.</div>
<div style="margin-top:90px;font-size:44px;font-weight:700">ENSIDEX Team</div></div>"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1920,'height':1080})
    for k,v in cards.items():
        Path(f'cards/{k}.html').write_text('<meta charset=utf-8>'+v)
        pg.goto('file:///workspace/demo-build-sb/cards/'+k+'.html'); pg.wait_for_timeout(3500 if k=='c7b' else 600)
        pg.screenshot(path=f'cards/{k}.png')
    b.close()
