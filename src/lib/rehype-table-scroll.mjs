/*
 * Wraps every Markdown table in its own scroll box.
 *
 * The alternative is a table that pushes the page sideways, which body's
 * overflow-x: hidden then silently clips: the row is not narrow, it is gone.
 * Doing it here rather than asking every author to remember a wrapper means
 * a page written as plain Markdown cannot get it wrong.
 */
export function rehypeTableScroll() {
  return (tree) => {
    visit(tree, 'element');

    function visit(node, type) {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        visit(child, type);
        if (child.type !== 'element' || child.tagName !== 'table') return child;
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'], tabindex: 0, role: 'region' },
          children: [child],
        };
      });
    }
  };
}
