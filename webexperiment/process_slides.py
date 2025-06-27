from bs4 import BeautifulSoup as BS
import xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np


keep_style_tags = ["color"]

# file = Path("slides/orig/Slide_1.html")
# if 1:
for file in Path("slides/orig").glob("*.html"):
    print(file.name)
    new = BS("", features='html.parser')
    with open(file,'r') as f:
        soup = BS(f, features='html.parser')

        if soup.table:
            print("Skippig file with table: " + str(file))
            new = soup
        else:

            # print(soup)
            # Extract headline
            if soup.h1:
                for h1 in soup.h1:
                    h1_new = new.new_tag('h1')
                    h1_new.string = h1.get_text()
                    new.append(h1_new)
            
            # Extract text
            if soup.h2:
                for h2 in soup.find_all('h2'):
                    check = lambda value: [v.split(":")[0].strip() not in keep_style_tags for v in value.split(";")]
                    for s in h2.find_all(style=lambda value: np.max(check(value)) if value else False):
                        style = s.attrs['style']
                        remove = check(style)
                        rest_style = np.array(style.split(";"))[np.array(remove)==False]
                        if len(rest_style):
                            s.attrs['style'] = ";".join(rest_style)
                        else:
                            s.attrs.pop("style")

                    p_new = new.new_tag('p')
                    for c in h2.contents:
                        p_new.extend(c)
                    new.append(p_new)

            if soup.p:
                for p in soup.p:
                    new.append(p)
            

        with open("slides/" + str(file.name),"w") as o:
            o.write(str(new))