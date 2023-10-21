import type { Parent, Data } from 'unist';
import type { Paragraph, Root, FootnoteDefinition, FootnoteReference, Link, Text } from 'mdast';
import type { Transformer } from 'unified';

let visit: typeof import('unist-util-visit').visit;
let SKIP: typeof import('unist-util-visit').SKIP;
let EXIT: typeof import('unist-util-visit').EXIT;

type FootnoteDefinitionWithChildren = FootnoteDefinition

type Footnote = Record<string, {
  label: string,
  count: number
}>

function addLabelToFootNode(footnote: Footnote, label: string) {
  if (typeof footnote[label] === 'undefined') {
    footnote[label] = {
      label: label,  
      count: 0,
    }
  }
  footnote[label].count++

  return footnote
}

(async () => {
  ({ visit, SKIP, EXIT } = await import('unist-util-visit'));
})();

export function remarkPlugin(): Transformer<Root> {

  return (tree, vFile) => {
    visit<Root, 'root'>(tree, (node: Root, index: number, parent: Parent) => {
      const children = node.children
      const isViewFootnote = vFile.data.isViewFootnote ?? false

      if (isViewFootnote || !children) {
        return EXIT
      }

      /** 如果存在脚注 */
      const hasFootnoteDef = children.some((_item) => {
        return _item.type === 'footnoteDefinition'
      }) 
    
      if (!hasFootnoteDef) {
        return EXIT
      }

      let footnote: Record<string, {
        label: string,
        count: number
      }> = {}

      children.forEach((_childNode) => {
        /**
         * 收集 paragraph 下的 footnoteReference
         * 需要在rephy 中解析html 语法，对对应的sup 做设置
         */
        if (_childNode.type === 'paragraph') {
          const paragraphChildren = _childNode.children
          const newSetChildren = new Set(paragraphChildren)
          let index = 0

          newSetChildren.forEach((item) => {
            index++
            if (item.type === 'footnoteReference') {
              const label = item.label
              if (!label) {
                return
              } 
              addLabelToFootNode(footnote, label)
              return
            } 
            if (item.type === 'text') {
              const pattern = /\^\[(.*?)\]/

              const matches = item.value.match(pattern)

              if (!matches || matches.length === 0) {
                return
              }
              const label = matches[1]
              addLabelToFootNode(footnote, label)
              
              /** 放入下面 */
              const textSplit = item.value.split(matches[0])
              paragraphChildren.splice(index - 1, 1, {
                type: 'text',
                value: textSplit[0]
              },
              {
                type: 'text',
                value: label
              }, {
                type: 'footnoteReference',
                label: label,
                identifier: label
              }, {
                type: 'text',
                value: textSplit[1]
              })

              children.push({
                type: 'footnoteDefinition',
                identifier: label,
                label: label,
                children: [{
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    value: label
                  }]
                }]
              })
            }
          })
        }
      })

      vFile.data.footnote = footnote
      vFile.data.isViewFootnote = true

      const footnoteDefNodes: FootnoteDefinitionWithChildren[] = []

      /** 遍历 footnoteDefinition，给节点添加信息，改成li 元素 */
      const newChildren = node.children.filter((_item) => {
        if (_item.type === 'footnoteDefinition') {
          footnoteDefNodes.push(_item)
          return false
        }
        return true
      })

      const listItems = footnoteDefNodes.map((fnNode, index) => {
        const fnNodeChild = fnNode.children
        const length = fnNodeChild.length
        const lastChild = fnNodeChild[length - 1] as unknown as Paragraph;

        const def = footnote[fnNode.identifier]

        const defNotes: Link[] = [];

        for(let i = 0; i < def.count; i++) {
          defNotes.push({
            type: 'link' as 'link',
            /** 跳转回定义脚注的位置 */
            url: `#fnref-${def.label}-${i}`,
            data: {
              hProperties: {
                class: 'dumi-footnote-footnote-backref',
              },
            },
            children: [{
              type: 'text',
              value: '↩',
            }]
          })
        }

        lastChild.children.push(...defNotes)

        return {
          type: 'listItem',
          /** todo: 需要在后面添加链接 */
          children: fnNodeChild,
          data: {
            hProperties: {
              /** 点击脚注跳转回来的地方 */
              id: `fndef-${fnNode.label}`,
              class: 'dumi-footnote-list-item',
              'data-label': fnNode.label
            },
          }
        }
      })
      
      const list = [
        {
          type: 'html',
          value: `<FootnoteDef name='脚注'>`
        },
        {
          type: 'list', 
          children: listItems,
          data: {
            hProperties: {
              class: 'dumi-footnote-list'
            }
          },
          ordered: true,
          start: 1,
        },
        {
          type: 'html',
          value: '</FootnoteDef>',
        }
      ]

      node.children = (newChildren as any).concat(list)
    }),
    visit<Root, 'footnoteReference'>(tree, 'footnoteReference', (node: FootnoteReference, index: number, parent: Parent) => {
      if (node.type !== 'footnoteReference') {
        return SKIP
      }

      node.data = {
        hProperties: {
          'data-label': node.label,
          class: 'dumi-footnote-footnote-ref',
        },
      }
    })
  }
}