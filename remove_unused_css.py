#!/usr/bin/env python3
"""
Improved script to safely remove unused CSS rules.
Extracts all used selectors from HTML and JavaScript with comprehensive pattern matching.
"""
import re
import os

def extract_used_selectors(html_files, js_files):
    """Extract all classes and IDs used in HTML and JS files."""
    used = set()
    
    # Common element selectors - always keep
    always_keep = {
        'body', 'html', '*', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'div', 'span', 'ul', 'li', 'img', 'button', 'input', 'form', 'nav',
        'section', 'article', 'header', 'footer', 'main', 'table', 'tr', 'td',
        'th', 'thead', 'tbody', 'tfoot', 'ol', 'dl', 'dt', 'dd', 'label',
        'select', 'textarea', 'svg', 'path', 'circle', 'rect', 'line', 'polyline',
        'polygon', 'ellipse', 'time', 'strong', 'em', 'b', 'i', 'u', 'small',
        'sub', 'sup', 'code', 'pre', 'blockquote', 'hr', 'br'
    }
    used.update(always_keep)
    
    # Extract from HTML
    for html_file in html_files:
        if not os.path.exists(html_file):
            continue
        with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Classes
            for match in re.finditer(r'class=["\']([^"\']+)["\']', content):
                for cls in match.group(1).split():
                    used.add('.' + cls)
            # IDs
            for match in re.finditer(r'id=["\']([^"\']+)["\']', content):
                used.add('#' + match.group(1))
            # Also check inline styles that might reference classes
            for match in re.finditer(r'\.([a-zA-Z0-9_-]+)', content):
                used.add('.' + match.group(1))
    
    # Extract from JavaScript - comprehensive pattern matching
    for js_file in js_files:
        if os.path.exists(js_file):
            with open(js_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
                # jQuery selectors: $('.class'), $('#id'), $('.class #id')
                for match in re.finditer(r'\$\(["\']([.#][^"\']+)["\']', content):
                    sel = match.group(1)
                    used.add(sel)
                    # Extract individual parts
                    for part in re.findall(r'([.#][a-zA-Z0-9_-]+)', sel):
                        used.add(part)
                
                # jQuery methods: .find('.class'), .filter('.class'), .closest('.class')
                for match in re.finditer(r'\.(?:find|filter|closest|parent|children|siblings|next|prev)\(["\']([.#][^"\']+)["\']', content):
                    sel = match.group(1)
                    used.add(sel)
                    for part in re.findall(r'([.#][a-zA-Z0-9_-]+)', sel):
                        used.add(part)
                
                # classList.add, className =, addClass, removeClass, toggleClass, hasClass
                for match in re.finditer(r'(?:class(?:List)?\.(?:add|remove|toggle|contains)|(?:add|remove|toggle|has)Class|className\s*[=:])\(?["\']([^"\']+)["\']', content):
                    cls = match.group(1)
                    if not cls.startswith(('.', '#')):
                        used.add('.' + cls)
                    else:
                        used.add(cls)
                        for part in re.findall(r'([.#][a-zA-Z0-9_-]+)', cls):
                            used.add(part)
                
                # querySelector, querySelectorAll, getElementById, getElementsByClassName
                for match in re.finditer(r'(?:querySelector(?:All)?|getElement(?:ById|sByClassName))\(["\']([^"\']+)["\']', content):
                    sel = match.group(1)
                    if sel.startswith(('.', '#')):
                        used.add(sel)
                        for part in re.findall(r'([.#][a-zA-Z0-9_-]+)', sel):
                            used.add(part)
                    elif 'Id' in match.group(0):
                        used.add('#' + sel)
                    else:
                        used.add('.' + sel)
                
                # Configuration objects: itemSelector: '.item', selector: '.class', filter: '.class'
                for match in re.finditer(r'(?:itemSelector|selector|filter|class)\s*:\s*["\']([.#][^"\']+)["\']', content):
                    sel = match.group(1)
                    used.add(sel)
                    for part in re.findall(r'([.#][a-zA-Z0-9_-]+)', sel):
                        used.add(part)
                
                # data-filter attributes (used by isotope)
                for match in re.finditer(r'data-filter=["\']([^"\']+)["\']', content):
                    filter_val = match.group(1)
                    if filter_val.startswith(('.', '#')):
                        used.add(filter_val)
                        for part in re.findall(r'([.#][a-zA-Z0-9_-]+)', filter_val):
                            used.add(part)
                
                # Any CSS class selector in strings: '.class-name'
                for match in re.finditer(r'["\']\s*([.#][a-zA-Z0-9_-]+(?:\s*[.#][a-zA-Z0-9_-]+)*)\s*["\']', content):
                    sel_str = match.group(1)
                    for part in re.findall(r'([.#][a-zA-Z0-9_-]+)', sel_str):
                        used.add(part)
    
    return used

def find_matching_brace(text, start_pos):
    """Find the matching closing brace for an opening brace."""
    depth = 1
    pos = start_pos + 1
    while pos < len(text) and depth > 0:
        if text[pos] == '{':
            depth += 1
        elif text[pos] == '}':
            depth -= 1
        elif text[pos] == '"' or text[pos] == "'":
            quote_char = text[pos]
            pos += 1
            while pos < len(text) and text[pos] != quote_char:
                if text[pos] == '\\':
                    pos += 1
                pos += 1
        pos += 1
    return pos - 1 if depth == 0 else -1

def parse_css_rules(css_content):
    """Parse CSS and extract rules with their positions."""
    rules = []
    i = 0
    
    while i < len(css_content):
        # Skip whitespace
        while i < len(css_content) and css_content[i] in ' \t\n\r':
            i += 1
        if i >= len(css_content):
            break
        
        # Skip comments
        if i < len(css_content) - 1 and css_content[i:i+2] == '/*':
            comment_end = css_content.find('*/', i + 2)
            if comment_end != -1:
                i = comment_end + 2
                continue
            else:
                break
        
        if i >= len(css_content):
            break
        
        # Check for @rule
        if css_content[i] == '@':
            atrule_start = i
            # Find the @rule name
            atrule_end = i + 1
            while atrule_end < len(css_content) and css_content[atrule_end] not in ' \t\n{':
                atrule_end += 1
            atrule_name = css_content[i:atrule_end].strip()
            
            # Find opening brace
            brace_pos = css_content.find('{', i)
            if brace_pos == -1:
                break
            brace_end = find_matching_brace(css_content, brace_pos)
            if brace_end == -1:
                break
            
            # For @media queries, parse inner rules
            if atrule_name == '@media':
                inner_content = css_content[brace_pos+1:brace_end]
                inner_rules = parse_css_rules(inner_content)
                rules.append({
                    'type': 'atrule',
                    'name': '@media',
                    'start': atrule_start,
                    'end': brace_end + 1,
                    'content': css_content[atrule_start:brace_end+1],
                    'inner_start': brace_pos + 1,
                    'inner_end': brace_end,
                    'inner_rules': inner_rules
                })
            else:
                rules.append({
                    'type': 'atrule',
                    'name': atrule_name,
                    'start': atrule_start,
                    'end': brace_end + 1,
                    'content': css_content[atrule_start:brace_end+1]
                })
            i = brace_end + 1
            continue
        
        # Regular CSS rule
        brace_pos = css_content.find('{', i)
        if brace_pos == -1:
            break
        
        selector_part = css_content[i:brace_pos].strip()
        brace_end = find_matching_brace(css_content, brace_pos)
        if brace_end == -1:
            break
        
        declarations = css_content[brace_pos+1:brace_end].strip()
        
        if selector_part and declarations:
            selectors = [s.strip() for s in selector_part.split(',')]
            rules.append({
                'type': 'rule',
                'selectors': selectors,
                'declarations': declarations,
                'start': i,
                'end': brace_end + 1,
                'content': css_content[i:brace_end+1]
            })
        
        i = brace_end + 1
    
    return rules

def extract_class_id_from_selector(selector):
    """Extract class and ID names from selector."""
    classes = set()
    ids = set()
    
    for match in re.finditer(r'\.([a-zA-Z0-9_-]+)', selector):
        classes.add('.' + match.group(1))
    
    for match in re.finditer(r'#([a-zA-Z0-9_-]+)', selector):
        ids.add('#' + match.group(1))
    
    return classes, ids

def is_selector_used(selector, used_selectors):
    """Check if selector contains any used classes or IDs - exact match only."""
    classes, ids = extract_class_id_from_selector(selector)
    all_selectors = classes | ids
    
    if not all_selectors:
        # No class/ID selector, keep it
        return True
    
    # Check exact matches only
    for sel in all_selectors:
        if sel in used_selectors:
            return True
    
    # For descendant selectors, check if parent class/ID is used
    parts = re.split(r'\s+', selector.strip())
    if len(parts) > 1:
        first_part = parts[0]
        first_classes, first_ids = extract_class_id_from_selector(first_part)
        for sel in first_classes | first_ids:
            if sel in used_selectors:
                return True
    
    # Check selector parts split by combinators (> + ~)
    parts = re.split(r'\s*[>+~]\s*', selector)
    if len(parts) > 1:
        for part in parts:
            part_classes, part_ids = extract_class_id_from_selector(part.strip())
            for sel in part_classes | part_ids:
                if sel in used_selectors:
                    return True
    
    return False

def remove_unused_css(css_file, used_selectors):
    """Remove unused CSS rules."""
    if not os.path.exists(css_file):
        return None, 0
    
    with open(css_file, 'r', encoding='utf-8', errors='ignore') as f:
        original = f.read()
    
    rules = parse_css_rules(original)
    
    kept_rules = []
    removed_rules = []
    total_removed_count = 0
    
    for rule in rules:
        if rule['type'] == 'atrule':
            # For @media queries, check inner rules
            if rule.get('name') == '@media' and 'inner_rules' in rule:
                kept_inner_rules = []
                removed_inner_rules = []
                for inner_rule in rule['inner_rules']:
                    if inner_rule['type'] == 'rule':
                        any_used = any(
                            is_selector_used(sel, used_selectors)
                            for sel in inner_rule['selectors']
                        )
                        if any_used:
                            kept_inner_rules.append(inner_rule)
                        else:
                            has_class_or_id = any(
                                bool(re.search(r'[.#][a-zA-Z0-9_-]+', sel))
                                for sel in inner_rule['selectors']
                            )
                            if has_class_or_id:
                                removed_inner_rules.append(inner_rule)
                                total_removed_count += 1
                            else:
                                kept_inner_rules.append(inner_rule)
                    else:
                        kept_inner_rules.append(inner_rule)
                
                if not kept_inner_rules:
                    removed_rules.append(rule)
                    total_removed_count += 1
                else:
                    # Rebuild @media content
                    inner_content = original[rule['inner_start']:rule['inner_end']]
                    removed_inner_positions = set()
                    for inner_rule in removed_inner_rules:
                        for pos in range(inner_rule['start'], inner_rule['end']):
                            removed_inner_positions.add(pos)
                    
                    kept_inner_rules.sort(key=lambda x: x['start'])
                    inner_parts = []
                    inner_last_pos = 0
                    
                    for inner_rule in kept_inner_rules:
                        before_text = inner_content[inner_last_pos:inner_rule['start']]
                        filtered_before = ''.join(
                            char for i, char in enumerate(before_text, start=inner_last_pos)
                            if i not in removed_inner_positions
                        )
                        inner_parts.append(filtered_before)
                        inner_parts.append(inner_rule['content'])
                        inner_last_pos = inner_rule['end']
                    
                    remaining_inner = inner_content[inner_last_pos:]
                    filtered_remaining_inner = ''.join(
                        char for i, char in enumerate(remaining_inner, start=inner_last_pos)
                        if i not in removed_inner_positions
                    )
                    inner_parts.append(filtered_remaining_inner)
                    
                    new_inner_content = ''.join(inner_parts)
                    atrule_header = original[rule['start']:rule['inner_start']]
                    new_rule_content = atrule_header + new_inner_content + '}'
                    
                    rule['content'] = new_rule_content
                    kept_rules.append(rule)
            else:
                kept_rules.append(rule)
        else:
            # Check if any selector in the rule is used
            any_used = False
            for selector in rule['selectors']:
                if is_selector_used(selector, used_selectors):
                    any_used = True
                    break
            
            if any_used:
                kept_rules.append(rule)
            else:
                # Only remove if it's a class/ID selector
                has_class_or_id = any(
                    bool(re.search(r'[.#][a-zA-Z0-9_-]+', sel))
                    for sel in rule['selectors']
                )
                if has_class_or_id:
                    removed_rules.append(rule)
                    total_removed_count += 1
                else:
                    kept_rules.append(rule)
    
    if total_removed_count == 0:
        return None, 0
    
    # Rebuild CSS
    removed_positions = set()
    for rule in removed_rules:
        for pos in range(rule['start'], rule['end']):
            removed_positions.add(pos)
    
    kept_rules.sort(key=lambda x: x['start'])
    result_parts = []
    last_pos = 0
    
    for rule in kept_rules:
        before_text = original[last_pos:rule['start']]
        filtered_before = ''.join(
            char for i, char in enumerate(before_text, start=last_pos)
            if i not in removed_positions
        )
        result_parts.append(filtered_before)
        result_parts.append(rule['content'])
        last_pos = rule['end']
    
    remaining_text = original[last_pos:]
    filtered_remaining = ''.join(
        char for i, char in enumerate(remaining_text, start=last_pos)
        if i not in removed_positions
    )
    result_parts.append(filtered_remaining)
    
    new_content = ''.join(result_parts)
    new_content = re.sub(r'\n\s*\n\s*\n+', '\n\n', new_content)
    
    return new_content, total_removed_count

def main():
    html_files = ['index.html', 'portfolio.html', 'contact.html', 'myskills.html']
    js_files = ['js/main.js', 'js/scripts.js', 'assets/js/main.js']
    css_files = ['css/all.css', 'css/screen.css', 'assets/css/style.css']
    
    print("Extracting used selectors...")
    used_selectors = extract_used_selectors(html_files, js_files)
    print(f"Found {len(used_selectors)} used selectors")
    
    # Verify critical classes are detected
    critical_classes = ['.fancybox', '.popup_portfolio', '.arcade-card', '.arcade-grid', 
                       '.filter-btn', '.retro-sidebar', '.retro-menu-item', '.sub_nav']
    print("\nVerifying critical classes:")
    for cls in critical_classes:
        status = "✓" if cls in used_selectors else "✗"
        print(f"  {status} {cls}")
    
    total_removed = 0
    for css_file in css_files:
        if not os.path.exists(css_file):
            continue
        print(f"\nProcessing {css_file}...")
        
        with open(css_file, 'r', encoding='utf-8', errors='ignore') as f:
            original = f.read()
        
        new_content, removed = remove_unused_css(css_file, used_selectors)
        
        if new_content and removed > 0:
            # Backup
            backup_file = css_file + '.backup'
            with open(backup_file, 'w', encoding='utf-8') as bf:
                bf.write(original)
            
            # Write new
            with open(css_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            original_size = len(original.encode('utf-8'))
            new_size = len(new_content.encode('utf-8'))
            reduction = ((original_size - new_size) / original_size) * 100 if original_size > 0 else 0
            
            print(f"  Removed {removed} unused CSS rules")
            print(f"  Size reduced by {reduction:.1f}% ({original_size} -> {new_size} bytes)")
            total_removed += removed
        else:
            print(f"  No unused CSS rules found")
    
    print(f"\nTotal: Removed {total_removed} unused CSS rules")

if __name__ == '__main__':
    main()

