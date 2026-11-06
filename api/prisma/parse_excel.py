import os
import json
import zipfile
import re
import xml.etree.ElementTree as ET

wb_path = r'C:\Users\ASUS\.gemini\antigravity\brain\9e58fef4-a576-416c-a84a-879686295c0e\.user_uploaded\media_1793889821504_5580577e.xlsx'
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def parse_sheet(z, sheet_xml_path, sheet_name):
    root = ET.fromstring(z.read(sheet_xml_path))
    rows = root.findall('.//s:row', ns)
    
    items = []
    
    for row in rows:
        r_num = int(row.attrib.get('r', 0))
        if r_num <= 3:
            continue
            
        cells = {}
        for c in row.findall('s:c', ns):
            cell_ref = c.attrib.get('r')
            col_letter = re.sub(r'[0-9]', '', cell_ref)
            
            is_tag = c.find('s:is', ns)
            v_tag = c.find('s:v', ns)
            val = ''
            if is_tag is not None:
                t = is_tag.find('s:t', ns)
                if t is not None and t.text:
                    val = t.text
            elif v_tag is not None and v_tag.text:
                val = v_tag.text
            
            cells[col_letter] = val.strip() if val else ''

        standar = cells.get('C', '').strip()
        nomor_ep = cells.get('D', '').strip()
        deskripsi = cells.get('E', '').strip()
        
        if not standar or not nomor_ep:
            continue
            
        item = {
            'sheet': sheet_name,
            'no': cells.get('A', '').strip(),
            'kelompok': cells.get('B', '').strip(),
            'standar': standar,
            'nomorEp': nomor_ep,
            'deskripsi': deskripsi,
            'kodeR': cells.get('F', '').strip(),
            'kodeD': cells.get('G', '').strip(),
            'kodeO': cells.get('H', '').strip(),
            'kodeW': cells.get('I', '').strip(),
            'kodeS': cells.get('J', '').strip(),
            'kelengkapanBukti': cells.get('K', '').strip(),
            'skoring': cells.get('L', '').strip(),
            'halamanPdf': cells.get('M', '').strip(),
            'statusKesiapan': cells.get('N', '').strip(),
            'picUnit': cells.get('O', '').strip(),
            'targetSelesai': cells.get('P', '').strip(),
            'catatanTindakLanjut': cells.get('Q', '').strip()
        }
        items.append(item)
        
    return items

all_items = []
with zipfile.ZipFile(wb_path, 'r') as z:
    sheets_info = [
        ('A-Manajemen', 'xl/worksheets/sheet2.xml'),
        ('B-Pelayanan', 'xl/worksheets/sheet3.xml'),
        ('C-SKP', 'xl/worksheets/sheet4.xml'),
        ('D-Prognas', 'xl/worksheets/sheet5.xml')
    ]
    for s_name, s_path in sheets_info:
        parsed = parse_sheet(z, s_path, s_name)
        print(f"Sheet {s_name}: parsed {len(parsed)} items")
        all_items.extend(parsed)

print(f"Total parsed items before normalization: {len(all_items)}")

# Normalization of standard codes to standard STARKES 16 Pokja conventions:
# 1. IPKP (Integrasi Pendidikan dalam Pelayanan Kesehatan / PPK)
# 2. PP (Pengkajian Pasien)
# 3. PKPO 3
# 4. SKP 3 vs SKP 3.1
for i, it in enumerate(all_items):
    # A-Manajemen IPKP
    if it['sheet'] == 'A-Manajemen' and it['standar'] == 'PPI 13':
        p = it['halamanPdf'].strip()
        if p == '214': it['standar'] = 'PPK 1'
        elif p in ('215', '216'): it['standar'] = 'PPK 2'
        elif p == '217': it['standar'] = 'PPK 3'
        elif p == '218': it['standar'] = 'PPK 4'
        elif p == '219': it['standar'] = 'PPK 5'
        elif p == '221': it['standar'] = 'PPK 6'
        
    # B-Pelayanan PP
    elif it['sheet'] == 'B-Pelayanan' and it['standar'] == 'HPK 4.2' and it['halamanPdf'].strip() not in ('273',):
        p = it['halamanPdf'].strip()
        page_map = {
            '277': 'PP 1',
            '278': 'PP 1.1',
            '279': 'PP 1.2',
            '280': 'PP 1.3',
            '282': 'PP 2',
            '283': 'PP 3',
            '284': 'PP 3.1',
            '285': 'PP 3.2',
            '286': 'PP 3.3',
            '287': 'PP 3.4',
            '288': 'PP 3.5',
            '289': 'PP 3.6',
            '290': 'PP 3.7',
            '291': 'PP 3.8',
            '292': 'PP 3.9',
            '293': 'PP 3.10',
            '294': 'PP 3.11',
            '295': 'PP 3.12',
        }
        if p in page_map:
            it['standar'] = page_map[p]
        elif p == '296':
            if it['nomorEp'] == 'a' and 'film' in it['deskripsi'].lower():
                it['standar'] = 'PP 3.13'
            elif it['nomorEp'] == 'b' and 'film' in it['deskripsi'].lower():
                it['standar'] = 'PP 3.13'
            else:
                it['standar'] = 'PP 3.14'
                
    # PKPO 3
    elif it['sheet'] == 'B-Pelayanan' and it['standar'] == 'PKPO 2' and it['halamanPdf'].strip() in ('352', '353'):
        it['standar'] = 'PKPO 3'
        
    # SKP 3 vs SKP 3.1
    elif it['sheet'] == 'C-SKP' and it['standar'] == 'SKP 3.1' and it['halamanPdf'].strip() == '385':
        it['standar'] = 'SKP 3'

out_path = r'D:\akreditasi\api\prisma\instruments.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(all_items, f, ensure_ascii=False, indent=2)

print(f"Normalized and saved {len(all_items)} to {out_path}")
