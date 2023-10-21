import type { Root, Element, ElementContent } from 'hast';
import type { Transformer } from 'unified';

let visit: typeof import('unist-util-visit').visit;
let SKIP: typeof import('unist-util-visit').SKIP
let CONTINUE: typeof import('unist-util-visit').CONTINUE


(async () => {
  ({ visit, SKIP, CONTINUE } = await import('unist-util-visit'));
})();

export function rehypePlugin(): Transformer<Root> {
  const supNodeMap: Record<string, number> = {}

  return async (tree, vFile) => {
    visit(tree, ['element'], (node: Element) => {
      const footnote: Record<string, any> = vFile.data.footnote || {}
      
      /** 如果当前文件没有脚注 */
      if (Object.keys(footnote).length === 0) {
        return SKIP
      }
      
      if (node.tagName !== 'sup') {
        return CONTINUE
      }

      const label = node.properties.dataLabel as string
      
      if (typeof supNodeMap[label] === 'undefined') {
        supNodeMap[label] = 0
      }

      const linkChildIndex = node.children.findIndex((_item) => {
        return _item.type === 'element' && _item.tagName === 'Link'
      });

      const currentChild: ElementContent & {
        properties?: Record<string, any>
      } = node.children[linkChildIndex];

      const linkText = (currentChild as any).children[0].value as string

      (currentChild as any).children = [{
        type: 'text',
        value: supNodeMap[label] === 0 ? linkText : `${linkText}:${supNodeMap[label]}`
      }]

      currentChild.properties = {
        ...currentChild.properties,
        id: `fnref-${label}-${supNodeMap[label]}`,
        to: `#fndef-${label}`
      }
      supNodeMap[label]++
    })
  }
}