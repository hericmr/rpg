export interface JBLDeviceState {
    isOn: boolean;
    state: string;
    isBluetoothEnabled: boolean;
    isPairingMode: boolean;
    volume: number;
}

export interface ComputerDeviceState {
    isOn: boolean;
    state: string;
    isUnlocked: boolean;
    isHacked: boolean;
    isKicked: boolean;
    isPairingMode: boolean;
    password: string;
}

export interface MusicState {
    isPlaying: boolean;
    currentSong: any;
    currentSongInfo: any;
}

export default interface GameState {
    jblState: JBLDeviceState;
    computerState: ComputerDeviceState;
    musicState: MusicState;
    isPaired: boolean;
} 