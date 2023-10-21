import React, {
  Children,
  cloneElement,
  useMemo,
  type FC,
  type ReactElement,
  type ReactNode,
} from 'react';

import './index.less';

interface FootnoteDefProps {
  children: ReactElement | string;
  name?: string
}

const FootnoteDef = (props: FootnoteDefProps) => {
  const { children, name } = props

  const Themes = useMemo<ReactNode>(() => {
    return Children.map(children, (child) => {
      if (typeof child === 'object' && child.type === 'ol') {
        const themeCases = child.props.children;
        if (Children.count(themeCases)) {
          const travelChildren = Children.map(themeCases, (theme, index) => {
            if (theme.type === 'li') {
              const themeInfo = theme.props as any;
              console.log(theme)
              return (
                <li id={theme.props.id} className={theme.props.className} key={theme.props.id}>
                  {theme.props.children}
                </li>
              );
            }
          });
          return cloneElement(child, {
            ...child.props,
            children: travelChildren,
          });
        }
      }
      return null;
    });
  }, [children]);

  return <div className="dumi-footnote-section">
    <div className='dumi-footnote-header'>{name}</div>
    {Themes}
  </div>;
}

export default FootnoteDef