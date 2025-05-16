export interface SongInfo {
    title: string;
    artist: string;
    description: string;
}

export const MUSICAS_REVOLUCIONARIAS: SongInfo[] = [
    {
        title: "Lésbica Futurista",
        artist: "G4B3",
        description: "um hino guardado há mais de cem anos."
    }
];

export const MENSAGENS_CONQUISTA = {
    jblOn: "💀 JBL LIGADA!!!",
    bluetoothOn: "💀 BlUETOTH QUANTICO LIGADO!!!",
    computerOn: "💀 Computador QUANTICO LIGADO!!!",
    pairingMode: "💀 Modo de pareamento ativado!!!",
    connected: "💀 JBL PAREADA COM O COMPUTADOR!!! Pronta para tocar música!",
    musicPlaying: "🎵 TOCANDO *Lésbica Futurista*! AS PAREDES TREMEEM"
};

export const ESTADOS_DISPOSITIVOS = {
    jbl: {
        off: {
            look: "\n\nUma JBL tunada que o prefeito Bruno fez overclock, cheia de graxa, fita isolante e LEDs quebrados. Circuitos pulsam sob a superfície.",
            use: "\nVocê liga a JBL. Os LEDs piscam... nada acontece.",
            talk: "\nMesmo desligada, a JBL É IMPACTANTE. Alcança 99 mil decibéis.",
            check: "\nSistema de som modificado clandestinamente. Potencial além do esperado."
        },
        on: {
            look: "\nA JBL pulsa com vida, padrões hipnóticos de luz emanando dela.",
            use: "\nBluetooth não está ativo. Talvez haja algum método para ativar...",
            talk: "\nEssa é a braba...",
            check: "\nBluetooth inativo. Sistema aguardando ativação."
        },
        bluetooth: {
            look: "\nOndas azuis emanam da JBL. Bluetooth está buscando conexões.",
            use: "\n\nVocê dobra a perna direita como o Daniel San e dá uma forte bença na JBL.\nBluetooth quântico foi ativado. Pronto para emparelhar com qualquer dispositivo da cidade.",
            talk: "\nOs LEDs pulsam como um coração digital.",
            check: "\nBluetooth quântico em funcionamento."
        },
        pairing: {
            look: "\nA JBL está em modo de pareamento, pulsando intensamente em busca de conexão.",
            use: "\nAguardando outro dispositivo para parear...",
            talk: "\nOs LEDs piscam em um padrão hipnótico de busca.",
            check: "\nModo de pareamento ativo. Aguardando conexão."
        },
        paired: {
            look: "\nA JBL está conectada ao computador, LEDs pulsando em sincronia com o sistema.",
            use: "\nA conexão está estável. Pronta para tocar música!",
            talk: "\nO sistema de som está em perfeita harmonia com o computador.",
            check: "\nPareamento bem-sucedido. Aguardando comando para tocar música."
        },
        playing: {
            look: "\nA JBL irradia luz e som, desafiando toda norma.",
            use: "\nA música transforma o ambiente em uma celebração queer futurista.",
            talk: "\nAs batidas dançam com sua voz.",
            check: "\nPotência máxima. A revolução está amplificada."
        }
    },
    computer: {
        off: {
            look: "\nUm computador antigo, mas com modificações misteriosas.",
            use: "\nVocê pressiona o botão de ligar. A máquina desperta.",
            talk: "\nSilêncio digital.",
            check: "\nDesligado. Potencial desconhecido."
        },
        on: {
            look: "\nA tela brilha com uma interface retro-futurista.",
            use: "\nO sistema está pronto para uso.",
            talk: "\nO ventilador sussurra códigos binários.",
            check: "\nSistema operacional iniciado. Aguardando comandos."
        },
        pairing: {
            look: "\nO computador está procurando dispositivos para parear.",
            use: "\nAguardando conexão Bluetooth...",
            talk: "\nSinais digitais procuram por uma conexão.",
            check: "\nModo de pareamento ativo. Buscando dispositivos."
        },
        paired: {
            look: "\nO computador está conectado à JBL, pronto para liberar as batidas.",
            use: "\nConexão estabelecida. Sistema pronto para tocar música.",
            talk: "\nOs dados fluem livremente entre os dispositivos.",
            check: "\nPareamento concluído. Sistemas sincronizados."
        },
        playing: {
            look: "\nA tela pulsa no ritmo da música, códigos dançando.",
            use: "\nA máquina vibra com as frequências sonoras.",
            talk: "\nAlgoritmos de som em plena execução.",
            check: "\nProcessando beats. Amplificação em andamento."
        }
    }
}; 