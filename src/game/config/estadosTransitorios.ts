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
    musicPlaying: "🎵 Lésbica Futurista TOCANDO NA JBL!!!"
};

export const ESTADOS_DISPOSITIVOS = {
    jbl: {
        off: {
            look: "Uma JBL que o prefeito fez overclock, cheia de graxa e LEDs quebrados. Circuitos pulsam sob a superfície.",
            use: "Você liga a JBL. Os LEDs piscam... e nada acontece.",
            talk: "Mesmo desligada, a JBL É IMPACTANTE. Alcança 99 mil decibéis.",
            check: "Sistema de som modificado clandestinamente. Potencial além do esperado."
        },
        on: {
            look: "A JBL pulsa com vida, padrões hipnóticos de luz emanando dela.",
            use: "Bluetooth não está ativo. Talvez haja algum método para ativar...",
            talk: "Essa é a braba...",
            check: "Bluetooth inativo. Sistema aguardando ativação."
        },
        bluetooth: {
            look: "Ondas azuis emanam da JBL. Bluetooth está buscando conexões.",
            use: "você dobra a perna direita como o daniel sam e dá uma forte bença na jbl. \nBluetooth quanticofoi ativado. Pronto para emparelhar com qualquer dispositivo da cidade  .",
            talk: "Os leds pulsam como um coração digital.",
            check: "Bluetoth quantico funcionamento."
        },
        paired: {
            look: "A JBL está conectada ao computador, LEDs pulsando em sincronia com o sistema.",
            use: "A conexão está estável. Pronta para tocar música!",
            talk: "O sistema de som está em perfeita harmonia com o computador.",
            check: "Pareamento bem-sucedido. Aguardando comando para tocar música."
        },
        playing: {
            look: "A JBL irradia luz e som, desafiando toda norma.",
            use: "A música transforma o ambiente em uma celebração queer futurista.",
            talk: "As batidas dançam com sua voz.",
            check: "Potência máxima. A revolução está amplificada."
        }
    },
    computer: {
        off: {
            look: "Notebook quantico velhissimo do ano de 2066, tem um adesiivo escrito USADO POR MIM PROGRAMADO POR DEISE.",
            use: "Você liga o computador. O logo antigo do SapphicOS pisca na tela.",
            talk: "As teclas velhas rangem suavemente.",
            check: "Sistema operacional SapphicOS versão 2066, última obra-prima de Deise."
        },
        on: {
            look: "A tela exibe um prompt de login retrô. PC brilha sob a luz.",
            use: "Sistema pede senha. O computador é meu, mas eu nao consigo lembrar a senha...",
            talk: "O cooler quantico barulhento conta histórias de décadas de uso.",
            check: "Login protegido. Deise não facilitava para ninguém."
        },
        unlocked: {
            look: "Interface familiar do SapphicOS, cada pixel lembra uma viagem lisergica. alias sera que comemos cogumelos ontem?",
            use: "Os programas antigos ainda rodam perfeitamente.",
            talk: "O sistema responde com aquele delay característico.",
            check: "Meus scripts de hacking estão aqui, todos organizados e documentados."
        },
        hacked: {
            look: "Tela cheia de código colorido. Deise deixou uma mensagem escondida!",
            use: "Modo administrador ativado. Os segredos de Deise são seus agora.",
            talk: "Entre os bits, você ouve ecos da risada da Deise.",
            check: "Kernel hackeado. Deise deixou essa porta dos fundos de propósito!"
        },
        paired: {
            look: "O computador está conectado à JBL, interface pulsando em sincronia.",
            use: "Sistema de som configurado. Pronto para tocar música!",
            talk: "A conexão com a JBL está perfeita.",
            check: "Pareamento concluído. Aguardando comando para iniciar a música."
        },
        playing: {
            look: "O computador toca Lésbica Futurista através da JBL!!!",
            use: "A música antiga ecoa pelos alto-falantes empoeirados.",
            talk: "A música faz o notebook vibrar como nos velhos tempos.",
            check: "Reproduzindo Lésbica Futurista na JBL. Volume e qualidade máximos!"
        }
    }
}; 