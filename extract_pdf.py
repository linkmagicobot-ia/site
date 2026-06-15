import zipfile, xml.etree.ElementTree as ET, sys, os

path = r"C:\Users\edval\Downloads\seo-audit-linkmagico-2026-06-09.docx"
out = r"C:\Users\edval\Downloads\seo-audit-linkmagico-2026-06-09.txt"

if not os.path.exists(path):
    print(f"File not found: {path}")
    sys.exit(1)

try:
    with zipfile.ZipFile(path, 'r') as z:
        xml_content = z.read('word/document.xml')
    
    root = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        texts = []
        for run in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
            if run.text:
                texts.append(run.text)
        if texts:
            paragraphs.append(''.join(texts))
    
    full_text = '\n'.join(paragraphs)
    
    with open(out, 'w', encoding='utf-8') as f:
        f.write(full_text)
    
    print(f"Extracted {len(paragraphs)} paragraphs to {out}")
    print(f"Total chars: {len(full_text)}")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
