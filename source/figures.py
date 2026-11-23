"""Render the site's small technical schematics as transparent, high-density PNGs."""
from math import exp
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

assets = Path(__file__).resolve().parents[1] / "site" / "assets"
scale = 3
ink, blue = "#163c36", "#28715e"
font_paths = ["/System/Library/Fonts/Menlo.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]
font_path = next((p for p in font_paths if Path(p).exists()), None)


def draw_figure(index):
    image = Image.new("RGBA", (204 * scale, 84 * scale))
    d = ImageDraw.Draw(image)
    def line(points, fill=blue, width=1.8):
        d.line([(round(x * scale), round(y * scale)) for x, y in points], fill, round(width * scale), joint="curve")
    def dot(x, y):
        r = 2.6
        d.ellipse([(round((x-r)*scale), round((y-r)*scale)), (round((x+r)*scale), round((y+r)*scale))], fill=ink)
    def text(x, y, label, size=11, fill=ink):
        font = ImageFont.truetype(font_path, size * scale) if font_path else ImageFont.load_default(size=size*scale)
        d.text((x*scale, y*scale), label, font=font, fill=fill)
    if index == 1:
        line([(8,32),(40,32),(45,24),(52,40),(59,24),(66,40),(73,24),(80,40),(85,32),(163,32)])
        dot(9,32); dot(117,32); dot(163,32)
        line([(117,32),(117,47)]);line([(105,47),(129,47)]);line([(105,53),(129,53)])
        line([(117,53),(117,67)]);line([(104,67),(130,67)]);line([(108,72),(126,72)]);line([(112,77),(122,77)])
        text(2,9,"Vin");text(137,9,"Vout");text(57,4,"R");text(133,44,"C")
    elif index == 2:
        text(2,1,"0xA5",12)
        for i, bit in enumerate("10100101"):
            x = 3+i*23
            d.rounded_rectangle((x*scale,26*scale,(x+20)*scale,51*scale),radius=3*scale,fill=blue if bit=="1" else "#dce9df",outline=blue,width=scale)
            text(x+6,31,bit,12,"#ffffff" if bit=="1" else ink)
        text(3,58,"D7",10);text(166,58,"D0",10)
    else:
        line([(7,70),(7,16)],"#54776c",1);line([(7,68),(183,68)],"#54776c",1)
        for x in range(7,179,9):
            line([(x,18),(x+5,18)],"#b37548",1)
        line([(7+i, 68-50*(1-exp(-i/42))) for i in range(170)],blue,2.4)
        text(0,0,"v",10);text(187,61,"t",10)
    image.save(assets / f"diagram-{index}.png", optimize=True)


if __name__ == "__main__":
    for number in (1,2,3):
        draw_figure(number)
