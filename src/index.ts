import type { IApi } from 'dumi';
import { remarkPlugin } from './core/remarkPlugin';
import { rehypePlugin } from './core/rehypePlugin';
import * as path from 'path'
import * as fs from 'fs-extra'

const COMPONENT_PATH = path.join(__dirname, '../es/components/FootnoteDef/index.js');
export default (api: IApi) => {
  api.register({
    key: 'modifyConfig',
    stage: Infinity,
    fn: (memo: IApi['config']) => {
      const cloneExtraRemarkPlugins = memo.extraRemarkPlugins;
      const cloneExtraRehypePlugins = memo.extraRehypePlugins;

      memo.extraRemarkPlugins = [
        [
          remarkPlugin,
        ],
        ...(Array.isArray(cloneExtraRemarkPlugins)
          ? cloneExtraRemarkPlugins
          : ([cloneExtraRemarkPlugins].filter(Boolean) as any)),
      ];
      memo.extraRehypePlugins = [
        rehypePlugin,
        ...(Array.isArray(cloneExtraRehypePlugins)
          ? cloneExtraRehypePlugins
          : ([cloneExtraRehypePlugins].filter(Boolean) as any)),
      ];

      return memo;
    },
  });
 
  // api.onGenerateFiles(() => {
  //   fs.copy(path.resolve(__dirname, './components'), path.join(api.cwd, '.dumi/theme/builtins'))
  // })
  api.register({
    key: 'modifyTheme',
    stage: Infinity,
    fn: (memo: IApi['config']) => {
      memo.builtins = Object.assign(
        {
          FootnoteDef: {
            specifier: 'FootnoteDef',
            source: COMPONENT_PATH,
          },
        },
        memo.builtins,
      );

      return memo;
    },
  });
};
