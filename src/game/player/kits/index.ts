// 캐릭터 id → 스킬 구현. characters.csv에 캐릭터를 추가하면 여기에도 등록해야 편성할 수 있다.
import type { Kit } from '../kit';
import { mido } from './mido';
import { serin } from './serin';
import { sia } from './sia';

export const KITS: Record<string, Kit> = { serin, mido, sia };
