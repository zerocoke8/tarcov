// 어떤 표시부로 캐릭터·몬스터를 그릴지 정하는 곳.
// 스프라이트 시트가 읽혀 있으면(public/sprites/<id>/) 스프라이트로, 아니면 도형 플레이스홀더로 그린다.
// 그래서 캐릭터 한 명, 동작 하나씩 그림이 준비되는 대로 바뀐다.
import { sprites } from '../sprites/SpriteStore';
import { PlaceholderChar } from './PlaceholderChar';
import { PlaceholderEnemy } from './PlaceholderEnemy';
import { SpriteChar } from './SpriteChar';
import { SpriteEnemy } from './SpriteEnemy';
import type { CharViewFactory, EnemyViewFactory } from './types';

export const createCharView: CharViewFactory = (def) => {
  const set = sprites.get(def.id);
  return set && set.clips.Idle ? new SpriteChar(set) : new PlaceholderChar(def);
};

export const createEnemyView: EnemyViewFactory = (e) => {
  const set = sprites.get(e.def.id);
  return set && set.clips.Idle ? new SpriteEnemy(e, set) : new PlaceholderEnemy(e);
};
