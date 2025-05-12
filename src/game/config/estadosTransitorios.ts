export interface SongInfo {
    title: string;
    artist: string;
    description: string;
}

export const MUSICAS_REVOLUCIONARIAS: SongInfo[] = [
    {
        title: "Lésbica Futurista",
        artist: "G4B3",
        description: "A única música que esse computador ainda toca, um hino guardado há décadas."
    }
];

export const MENSAGENS_CONQUISTA = {
    jblOn: "💀 JBL LIGADA!!!",
    bluetoothOn: "💀 BlUETOTH QUANTICO LIGADO!!!",
    computerOn: "💀 Computador QUANTICO LIGADO!!!",
    computerHacked: "💀 Sistema hackeado!!",
    connected: "💀 JBL PAREADA COM O COMPUTADOR!!! Pronta para tocar música!",
    musicPlaying: "\U0001f3b5 TOCANDO *Lésbica Futurista*! AS PAREDES TREMEEM"
};

export const ESTADOS_DISPOSITIVOS = {
    jbl: {
        off: {
            look: "\n\nUma JBL tunada que o prefeito Bruno fez overclock, cheia de graxa fita isolante e LEDs quebrados. Circuitos pulsam sob a superfície.",
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
            use: "\n\n Você dobra a perna direita como o daniel sam e dá uma forte bença na jbl. \nBluetooth quanticofoi ativado. Pronto para emparelhar com qualquer dispositivo da cidade  .",
            talk: "\nOs leds pulsam como um coração digital.",
            check: "\nBluetoth quantico funcionamento."
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
            look: "\nNotebook quantico velhissimo do ano de 2066, tem um adesiivo escrito USADO POR MIM PROGRAMADO POR DEISE.",
            use: "\nVocê liga o computador. O logo antigo do SapphicOS pisca na tela.",
            talk: "\nAs teclas velhas rangem suavemente.",
            check: "\nSistema operacional SapphicOS versão 2066, última obra-prima de Deise."
        },
        on: {
            look: "\nA tela exibe um prompt de login retrô. PC brilha sob a luz.",
            use: "\nSistema pede senha. O computador é meu, mas eu nao consigo lembrar a senha...",
            talk: "\nO cooler quantico barulhento conta histórias de décadas de uso.",
            check: "\nLogin protegido. Deise não facilitava para ninguém."
        },
        unlocked: {
            look: "\nInterface do HericOS, cada pixel lembra uma viagem lisergica. alias sera que comemos cogumelos ontem?",
            use: "\nOs programas antigos ainda rodam perfeitamente.",
            talk: "\nO sistema responde com aquele delay característico.",
            check: "\nMeus scripts de hacking estão aqui, todos organizados e documentados."
        },
        hacked: {
            look: "\nTela cheia de código colorido. Estilo matrix",
            use: "\nModo administrador ativado. ",
            talk: "\nEntre os bits, você ouve ecos do além.",
            check: "\nKernel hackeado!"
        },
        paired: {
            look: "\nO computador está conectado à JBL, interface pulsando em sincronia.",
            use: "\nSistema de som configurado. Pronto para tocar música!",
            talk: "\nA conexão com a JBL está perfeita.",
            check: "\nPareamento concluído. Aguardando comando para iniciar a música."
        },
        playing: {
            look: "\nO computador toca Lésbica Futurista através da JBL!!!",
            use: "\nA música antiga ecoa pelos alto-falantes empoeirados.",
            talk: "\nA música faz o notebook vibrar como nos velhos tempos.",
            check: "\nReproduzindo Lésbica Futurista na JBL. Volume e qualidade máximos!"
        }
    }
}; 