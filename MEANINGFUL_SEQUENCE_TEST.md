# WCAG 1.3.2 - Meaningful Sequence Test

## Overview

This test implements **heuristic detection** for WCAG 1.3.2 "Meaningful Sequence" - ensuring that the reading order of content is meaningful when presented programmatically.

## What It Tests

### ✅ **Automated Checks**

#### 1. **CSS Reordering Detection**
- ✅ Flexbox `order` property usage
- ✅ CSS Grid positioning (`grid-row`, `grid-column`)
- ✅ Absolute/fixed positioning that breaks flow
- ✅ Negative margins that reorder visually
- ✅ Float layouts that affect reading order
- ✅ RTL bidi-override issues

#### 2. **Tabindex Issues**
- ✅ Positive `tabindex` values (override natural order)
- ✅ Non-sequential tabindex values
- ✅ Tab order mismatches

#### 3. **Visual vs DOM Order**
- ✅ Main content vs navigation position mismatches
- ✅ Visual top-to-bottom vs DOM order differences

---

## How It Works

### Detection Logic

```typescript
// Example issues detected:

1. CSS Flexbox Order
   <div style="order: 3">Content</div>
   ⚠️ Element uses CSS order which may change visual sequence

2. Positive Tabindex
   <button tabindex="5">Click</button>
   ❌ Positive tabindex overrides natural tab order

3. Absolute Positioning
   <div style="position: absolute; top: 0">Header</div>
   ⚠️ May disrupt natural reading order

4. Non-Sequential Tabindex
   Elements with tabindex: [1, 5, 3, 2]
   ❌ Should be sequential or use natural order
```

### Status Results

| Status | Meaning |
|--------|---------|
| **Pass** | No potential sequence issues detected |
| **Warning** | CSS reordering or layout patterns that may affect order |
| **Fail** | Serious issues like non-sequential tabindex |

---

## Limitations

### ❌ **Cannot Automatically Detect:**

1. **Content Meaning**
   - Cannot determine if sequence is semantically "meaningful"
   - Requires human judgment

2. **Context Understanding**
   - Cannot know author's intent
   - Cannot validate complex layouts (dashboards, cards)

3. **Cultural Patterns**
   - Cannot determine correct reading order for all languages
   - LTR vs RTL considerations

4. **Dynamic Content**
   - Cannot predict JavaScript-based reordering
   - Cannot test single-page app route changes

---

## Manual Testing Required

After reviewing automated results, **manual testing is essential:**

### 1. **Screen Reader Test**
```
✓ Use NVDA/JAWS to read through the page
✓ Verify reading order makes sense
✓ Check if important info is in logical order
```

### 2. **Keyboard Navigation**
```
✓ Tab through all interactive elements
✓ Verify focus moves in logical order
✓ Can you complete tasks in sequence?
```

### 3. **CSS Disabled Test**
```
✓ Disable CSS (browser dev tools)
✓ Does content still make sense linearly?
✓ Are related items grouped together?
```

### 4. **Multi-Column Layouts**
```
✓ Check if columns read in correct order
✓ Verify vertical reading order
✓ Test responsive breakpoints
```

### 5. **Mobile/Responsive**
```
✓ Test on different viewport sizes
✓ Verify reordered content maintains meaning
✓ Check touch target order
```

---

## Common Issues Found

### 🔴 **Critical Issues**

1. **Non-Sequential Tabindex**
   ```html
   <!-- BAD -->
   <button tabindex="1">First</button>
   <button tabindex="5">Second</button>
   <button tabindex="3">Third</button>
   
   <!-- GOOD -->
   <button>First</button>
   <button>Second</button>
   <button>Third</button>
   ```

2. **Navigation After Main in DOM, Before Visually**
   ```html
   <!-- BAD: DOM order -->
   <main>Main content</main>
   <nav>Navigation</nav>
   
   <!-- But CSS positions nav above main visually -->
   ```

### ⚠️ **Warnings to Review**

1. **Flexbox Order**
   ```css
   /* May be okay if used intentionally */
   .item-1 { order: 3; }
   .item-2 { order: 1; }
   .item-3 { order: 2; }
   ```

2. **CSS Grid Positioning**
   ```css
   /* Review: Does visual order match reading order? */
   .item { grid-row: 3; grid-column: 1; }
   ```

---

## Best Practices

### ✅ **Do**

1. **Use Natural DOM Order**
   - Arrange content in meaningful order in HTML
   - Let visual order follow DOM order

2. **Tabindex 0 or -1 Only**
   ```html
   <div tabindex="0">Focusable in natural order</div>
   <div tabindex="-1">Programmatically focusable</div>
   ```

3. **CSS for Visual Enhancement Only**
   - Use CSS to enhance, not change reading order
   - Test with CSS disabled

4. **Group Related Content**
   - Keep related items together in DOM
   - Use semantic HTML structures

### ❌ **Don't**

1. **Avoid Positive Tabindex**
   ```html
   <!-- BAD -->
   <button tabindex="1">Click</button>
   ```

2. **Don't Rely on CSS for Sequence**
   ```css
   /* BAD: Visual order != DOM order */
   .footer { order: -1; } /* Visually first, DOM last */
   ```

3. **Don't Break Visual Flow**
   ```css
   /* BAD: Content jumps around */
   .content { position: absolute; top: -200px; }
   ```

---

## Integration

### Test Location
- **File:** `utils/meaningfulSequenceHelper.ts`
- **Test ID:** 1.3.2
- **Runs:** Automatically in quick-scan

### Test Output

```bash
🎨 Testing Perceivable criteria...
   • 1.1.1 Alt Text: pass
   • 1.3.2 Meaningful Sequence: warning  ← New test!
   • 1.4.3 Contrast: pass
```

### Report Details
- **Pass:** No sequence issues detected
- **Warning:** Potential issues found (manual review)
- **Fail:** Serious issues (tabindex problems)

---

## References

- **WCAG 1.3.2:** [Meaningful Sequence](https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence.html)
- **Level:** A (Critical)
- **Principle:** Perceivable
- **Guideline:** 1.3 Adaptable

---

## Example Results

### ✅ Good Page
```
Status: Pass
Issues: 0
Notes: No CSS reordering or tabindex issues detected
```

### ⚠️ Needs Review
```
Status: Warning
Issues: 3
- CSS Flexbox Order detected in navigation menu
- Grid positioning used in content cards
- Float layout in sidebar
Notes: Manual review recommended to verify sequence is meaningful
```

### ❌ Has Problems
```
Status: Fail  
Issues: 5
- Non-sequential tabindex values: [1, 5, 3, 2]
- Positive tabindex found on 4 buttons
- Main content before navigation in DOM but after visually
Notes: Fix tabindex issues immediately
```

---

## Testing Tips

1. **Use Browser DevTools**
   - Inspect element order in DOM tree
   - Check computed styles for order/position
   - Use Accessibility Inspector

2. **Test with Real Users**
   - Watch screen reader users navigate
   - Observe keyboard-only navigation
   - Ask if order makes sense

3. **Automated + Manual**
   - Use automated test to find suspects
   - Manually verify each flagged issue
   - Document decisions for future reference

---

## Summary

✅ **Automated test detects:** CSS reordering, tabindex issues, layout patterns  
⚠️ **Manual review required:** Verify sequence is actually meaningful  
📋 **Best for:** Finding technical issues that affect reading order  
❌ **Cannot replace:** Human judgment on content meaningfulness

