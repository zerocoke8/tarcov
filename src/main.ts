import './styles/main.css';
import { blockZoom } from './input/noZoom';

/** 시작하지 못했을 때 원인을 화면에 보여 준다 (수치 테이블 오류 등) */
function showFatal(err: unknown): void {
  const box = document.createElement('div');
  box.className = 'fatal';
  const e = err as { message?: string; stack?: string };
  box.textContent = '게임을 시작하지 못했습니다.\n\n' + (e?.message ?? String(err));
  document.getElementById('app')!.appendChild(box);
  console.error(err);
}

async function boot(): Promise<void> {
  // 화면 확대(두 손가락 벌리기, 두 번 두드리기)를 막는다. 게임을 읽기 전에 걸어 두어 로비에서도 막힌다
  blockZoom();
  try {
    // 수치 테이블에 문제가 있으면 여기서 오류가 난다
    const [{ Stage }, { Game }] = await Promise.all([import('./render/Stage'), import('./Game')]);
    const stage = await Stage.create(document.getElementById('stage')!);
    const game = new Game(stage, document.getElementById('ui')!);
    // 개발·자동 테스트용 접근점
    (window as unknown as { __game: unknown }).__game = game;
  } catch (err) {
    showFatal(err);
  }
}

void boot();
