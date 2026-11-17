// 어떤 표시부로 캐릭터·몬스터를 그릴지 정하는 곳.
// 스프라이트 애니메이션이 준비되면 여기서 캐릭터 id별로 스프라이트 표시부를 돌려주게 바꾼다.
import { PlaceholderChar } from './PlaceholderChar';
import { PlaceholderEnemy } from './PlaceholderEnemy';
import type { CharViewFactory, EnemyViewFactory } from './types';

export const createCharView: CharViewFactory = (def) => new PlaceholderChar(def);
export const createEnemyView: EnemyViewFactory = (e) => new PlaceholderEnemy(e);
