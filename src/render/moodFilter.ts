// 화면 분위기 셰이더: 맵(바닥·벽·오브젝트·캐릭터)을 한 번에 어둡고 빛바래게 물들인다.
//
//  - 채도를 낮추고, 어두운 곳에는 차가운 색을 입힌다.
//  - 필드 캐릭터 둘레는 밝고(손전등을 든 것처럼), 멀어질수록 어두워진다. 화면 가장자리는 더 어둡다.
//  - 밝은 것(불빛, 빛나는 장식)은 어둠을 덜 받는다. 어둠 속에서 빛나는 것이 도드라진다.
//
// 이펙트 층(타격, 숫자, 체력 막대)은 이 셰이더 밖에서 그려진다 (Stage 의 scene 묶음만 물들인다). 그래서 전투 표시는 어두워지지 않는다.
// 곱해서 어둡게 하므로 몬스터·공격 예고와 바닥의 밝기 차이(대비)는 그대로 남는다.
import { Filter, GlProgram } from 'pixi.js';
import type { MoodLook } from './mood';

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;
out vec2 vScreen;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    gl_Position = vec4(position, 0.0, 1.0);
    vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
    // 화면에서의 자리 (왼쪽 위 0,0 ~ 오른쪽 아래 1,1)
    vScreen = aPosition;
}
`;

const fragment = `
in vec2 vTextureCoord;
in vec2 vScreen;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uSat;
uniform float uDark;
uniform float uLit;
uniform vec3 uTint;
uniform vec3 uWarm;
uniform vec2 uLight;
uniform vec2 uRadius;
uniform float uAspect;
uniform float uVignette;
uniform float uKeep;

void main(void)
{
    vec4 c = texture(uTexture, vTextureCoord);
    if (c.a <= 0.0) {
        finalColor = c;
        return;
    }
    vec3 rgb = c.rgb / c.a;
    float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
    rgb = mix(vec3(luma), rgb, uSat);

    // 빛의 웅덩이: 바닥에 드리운 빛처럼 옆으로 조금 넓다
    vec2 d = (vScreen - uLight) * vec2(uAspect, 1.25);
    float lit = 1.0 - smoothstep(uRadius.x, uRadius.y, length(d));
    // 화면 가장자리 (모서리에서 가장 어둡다)
    float edge = smoothstep(0.55, 1.4, length((vScreen - 0.5) * 2.0));
    float amb = mix(uDark, uLit, lit) * (1.0 - uVignette * edge);
    // 밝은 것은 어둠을 덜 받는다
    float keep = smoothstep(0.7, 1.0, luma) * uKeep;
    rgb *= mix(uTint, uWarm, lit) * mix(amb, max(amb, 1.0), keep);

    // 어두운 색이 띠처럼 끊겨 보이지 않게 아주 약하게 흩뿌린다
    float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    rgb += n / 255.0;
    finalColor = vec4(clamp(rgb, 0.0, 1.0) * c.a, c.a);
}
`;

interface MoodUniforms {
  uSat: number;
  uDark: number;
  uLit: number;
  uTint: Float32Array;
  uWarm: Float32Array;
  uLight: Float32Array;
  uRadius: Float32Array;
  uAspect: number;
  uVignette: number;
  uKeep: number;
}

export class MoodFilter extends Filter {
  private u: MoodUniforms;

  constructor() {
    super({
      glProgram: GlProgram.from({ vertex, fragment, name: 'mood-filter' }),
      resources: {
        moodUniforms: {
          uSat: { value: 1, type: 'f32' },
          uDark: { value: 1, type: 'f32' },
          uLit: { value: 1, type: 'f32' },
          uTint: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
          uWarm: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
          uLight: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
          uRadius: { value: new Float32Array([0.3, 1]), type: 'vec2<f32>' },
          uAspect: { value: 2, type: 'f32' },
          uVignette: { value: 0, type: 'f32' },
          uKeep: { value: 0.8, type: 'f32' },
        },
      },
      // 기본값(1배, 계단 줄이기 없음)으로 두면 화소 밀도가 높은 화면에서 맵이 흐려진다. 화면과 같은 해상도로 그린다
      resolution: 'inherit',
      antialias: 'inherit',
    });
    this.u = (this.resources.moodUniforms as { uniforms: MoodUniforms }).uniforms;
  }

  /** 분위기를 바꾼다 (섹터에 들어갈 때) */
  use(look: MoodLook): void {
    const u = this.u;
    u.uSat = look.sat;
    u.uDark = look.dark;
    u.uLit = look.lit;
    u.uTint.set(look.tint);
    u.uWarm.set(look.warm);
    u.uRadius[0] = look.inner;
    u.uRadius[1] = look.outer;
    u.uVignette = look.vignette;
    u.uKeep = look.keep;
  }

  /**
   * 빛의 중심을 옮긴다 (매 프레임).
   * @param x, y 화면에서의 자리 (0~1)
   * @param aspect 화면의 가로 / 세로
   */
  light(x: number, y: number, aspect: number): void {
    this.u.uLight[0] = x;
    this.u.uLight[1] = y;
    this.u.uAspect = aspect;
  }
}
