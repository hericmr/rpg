export type JBLState = 'off' | 'on' | 'bluetooth' | 'playing' | 'paired';
export type ComputerState = 'off' | 'on' | 'unlocked' | 'hacked' | 'playing' | 'paired';

export interface JBLDeviceState {
    isOn: boolean;
    state: JBLState;
    isBluetoothEnabled: boolean;
    volume: number;
}

export interface ComputerDeviceState {
    isOn: boolean;
    state: ComputerState;
    isUnlocked: boolean;
    isHacked: boolean;
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
        volume: 0.6
    };

    private _computerState: ComputerDeviceState = {
        isOn: false,
        state: 'off',
        isUnlocked: false,
        isHacked: false,
        password: 'sapphic_future_2025'
    };

    private _musicState: MusicState = {
        isPlaying: false,
        currentSong: null,
        currentSongInfo: null
    };

    private _isPaired: boolean = false;

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

    // Setters with state synchronization
    set jblState(newState: JBLDeviceState) {
        this._jblState = newState;
        if (newState.state === 'playing') {
            this._computerState.state = 'playing';
        }
    }

    set computerState(newState: ComputerDeviceState) {
        this._computerState = newState;
        if (newState.state === 'playing') {
            this._jblState.state = 'playing';
        }
    }

    set musicState(newState: MusicState) {
        this._musicState = newState;
    }

    set isPaired(value: boolean) {
        this._isPaired = value;
    }

    public resetState(): void {
        this._jblState = {
            isOn: false,
            state: 'off',
            isBluetoothEnabled: false,
            volume: 0.6
        };

        this._computerState = {
            isOn: false,
            state: 'off',
            isUnlocked: false,
            isHacked: false,
            password: 'sapphic_future_2025'
        };

        this._musicState = {
            isPlaying: false,
            currentSong: null,
            currentSongInfo: null
        };

        this._isPaired = false;
    }
}

export default GameState; 