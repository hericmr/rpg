import { GBC_COLORS } from '../config/colors';

export class GBEffect {
    private scene: Phaser.Scene;
    private renderTexture!: Phaser.GameObjects.RenderTexture;
    private scanlineShader!: Phaser.Display.BaseShader;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createRenderTexture();
        this.createScanlineShader();
    }

    private createRenderTexture() {
        this.renderTexture = this.scene.add.renderTexture(0, 0, 160, 144);
        this.renderTexture.setOrigin(0);
        this.renderTexture.setScrollFactor(0);
    }

    private createScanlineShader() {
        this.scanlineShader = new Phaser.Display.BaseShader('ScanlineShader', `
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
                
                gl_FragColor = color;
            }
        `);
    }

    public preRender() {
        this.renderTexture.clear();
    }

    public render(scene: Phaser.Scene) {
        this.renderTexture.draw(scene.children.list);
        // Apply shader effect through the pipeline instead
        const renderer = this.scene.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
        if (renderer && renderer.pipelines) {
            const pipeline = renderer.pipelines.get('GBEffect');
            if (pipeline) {
                this.renderTexture.setPipeline('GBEffect');
            }
        }
    }

    public destroy() {
        this.renderTexture.destroy();
    }
} 