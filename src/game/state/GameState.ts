export type JBLState = 'off' | 'on' | 'bluetooth' | 'pairing' | 'paired' | 'playing';
export type ComputerState = 'off' | 'on' | 'pairing' | 'paired' | 'playing';

export interface JBLDeviceState {
    isOn: boolean;
    state: JBLState;
    isBluetoothEnabled: boolean;
    isPairingMode: boolean;
    volume: number;
}

export interface ComputerDeviceState {
    isOn: boolean;
    state: ComputerState;
    isUnlocked: boolean;
    isHacked: boolean;
    isKicked: boolean;
    isPairingMode: boolean;
    password: string;
}

export interface MusicState {
    isPlaying: boolean;
    currentSong: Phaser.Sound.BaseSound | null;
    currentSongInfo: any | null;
}

class GameState {
    private static instance: GameState;
    
    private constructor() {
        this.resetState();
    }

    public static getInstance(): GameState {
        if (!GameState.instance) {
            GameState.instance = new GameState();
        }
        return GameState.instance;
    }

    private _jblState: JBLDeviceState = {
        isOn: false,
        state: 'off',
        isBluetoothEnabled: false,
        isPairingMode: false,
        volume: 0.6
    };

    private _computerState: ComputerDeviceState = {
        isOn: false,
        state: 'off',
        isUnlocked: false,
        isHacked: false,
        isKicked: false,
        isPairingMode: false,
        password: 'sapphic_future_2025'
    };

    private _musicState: MusicState = {
        isPlaying: false,
        currentSong: null,
        currentSongInfo: null
    };

    private _isPaired: boolean = false;
    private _hasOpenedGameScene: boolean = false;

    // Getters
    get jblState(): JBLDeviceState {
        return this._jblState;
    }

    get computerState(): ComputerDeviceState {
        return this._computerState;
    }

    get musicState(): MusicState {
        return this._musicState;
    }

    get isPaired(): boolean {
        return this._isPaired;
    }

    get hasOpenedGameScene(): boolean {
        return this._hasOpenedGameScene;
    }

    // Setters with state synchronization
    private updateJBLState(): void {
        const jbl = this._jblState;

        if (!jbl.isOn) {
            jbl.state = 'off';
        } else if (this._musicState.isPlaying) {
            jbl.state = 'playing';
        } else if (this._isPaired) {
            jbl.state = 'paired';
        } else if (jbl.isPairingMode) {
            jbl.state = 'pairing';
        } else if (jbl.isBluetoothEnabled) {
            jbl.state = 'bluetooth';
        } else {
            jbl.state = 'on';
        }
    }

    private updateComputerState(): void {
        const pc = this._computerState;

        if (!pc.isOn) {
            pc.state = 'off';
        } else if (this._musicState.isPlaying) {
            pc.state = 'playing';
        } else if (this._isPaired) {
            pc.state = 'paired';
        } else if (pc.isPairingMode) {
            pc.state = 'pairing';
        } else {
            pc.state = 'on';
        }
    }

    set jblState(newState: JBLDeviceState) {
        this._jblState = newState;
        this.updateJBLState();
        if (newState.state === 'playing') {
            this._computerState.state = 'playing';
        }
    }

    set computerState(newState: ComputerDeviceState) {
        this._computerState = newState;
        this.updateComputerState();
        if (newState.state === 'playing') {
            this._jblState.state = 'playing';
        }
    }

    set musicState(newState: MusicState) {
        this._musicState = newState;
        this.updateJBLState();
        this.updateComputerState();
    }

    set isPaired(value: boolean) {
        this._isPaired = value;
        this.updateJBLState();
        this.updateComputerState();
    }

    set hasOpenedGameScene(value: boolean) {
        this._hasOpenedGameScene = value;
    }

    public resetState(): void {
        this._jblState = {
            isOn: false,
            state: 'off',
            isBluetoothEnabled: false,
            isPairingMode: false,
            volume: 0.6
        };

        this._computerState = {
            isOn: false,
            state: 'off',
            isUnlocked: false,
            isHacked: false,
            isKicked: false,
            isPairingMode: false,
            password: 'sapphic_future_2025'
        };

        this._musicState = {
            isPlaying: false,
            currentSong: null,
            currentSongInfo: null
        };

        this._isPaired = false;
        this._hasOpenedGameScene = false;
    }
}

export default GameState; 