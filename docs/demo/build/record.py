import time, json
from playwright.sync_api import sync_playwright
marks={}
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':1920,'height':1080}, record_video_dir='rec', record_video_size={'width':1920,'height':1080})
    t0=time.monotonic()
    pg=ctx.new_page()
    def m(k): marks[k]=round(time.monotonic()-t0,2); print(k,marks[k],flush=True)
    pg.goto('http://localhost:8787'); pg.add_style_tag(path='inject.css')
    pg.wait_for_selector('text=PayPal: sandbox'); m('s2_start'); pg.wait_for_timeout(5000); m('s2_end')
    def ask(text, key, hold=4000):
        n=pg.locator('.bubble.assistant:not(.typing)').count()
        m(key+'_start'); pg.click('form input'); pg.keyboard.type(text, delay=45); pg.wait_for_timeout(400); pg.keyboard.press('Enter')
        pg.wait_for_function(f"document.querySelectorAll('.bubble.assistant:not(.typing)').length>{n}", timeout=90000)
        m(key+'_reply'); pg.wait_for_timeout(hold); m(key+'_end')
    ask("Bill Ahmed Ali $300 for logo design due Friday",'s3',6000)
    ask("سوّ فاتورة لسارة 500 ريال عن تصميم موقع تستحق الخميس",'s4',6000)
    ask("Payment link $49 for consultation call",'s5',2000)
    l=pg.locator('a:has-text("Open payment link")').last
    if l.count(): l.hover(); pg.wait_for_timeout(3000)
    m('s5_end2')
    ask("Summarize my unpaid invoices",'s6a',9000)
    ask("Send a reminder for Omar Haddad's overdue invoice",'s6b',4000)
    pg.screenshot(path='final-state.png')
    vpath=pg.video.path(); ctx.close(); b.close()
json.dump({'marks':marks,'video':str(vpath)},open('marks.json','w'),indent=1)
print(vpath)
