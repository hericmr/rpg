import { GBC_COLORS } from '../config/colors';

export class GBPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game: Phaser.Game) {
        super({
            game,
            renderTarget: true,
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform vec2 resolution;
                varying vec2 outTexCoord;
                
                void main() {
                    vec2 uv = outTexCoord;
                    vec4 color = texture2D(uMainSampler, uv);
                    
                    // Add scanlines
                    float scanline = sin(uv.y * resolution.y * 2.0) * 0.02;
                    color.rgb += scanline;
                    
                    // Add slight color blending
                    color.rgb = mix(color.rgb, vec3(0.0, 0.3, 0.0), 0.1);
                    
                    // Preserve sprite edges
                    if (color.a > 0.0) {
                        color.rgb = mix(color.rgb, vec3(0.0, 0.3, 0.0), 0.1);
                    }
                    
                    gl_FragColor = color;
                }
            `
        });
    }

    onPreRender() {
        this.set1f('resolution', this.renderer.width);
    }
} 