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
    computerHacked: "💀 Sistema hackeado!!",
    connected: "💀 JBL PAREADA COM O COMPUTADOR!!! Pronta para tocar música!",
    musicPlaying: "🎵 TOCANDO *Lésbica Futurista*! AS PAREDES TREMEEM"
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
            look: "\n\nMeu velho Notebook de guerra, uma reliquia de 2086. Tem um adesivo: \n\nUSADO POR MIM, PROGRAMADO POR DEISE",
            use: "\nVocê liga o pC o led pisca.",
            talk: "\nTeclas antigas gemem.",
            check: "\nSapphicOS 2066. Última obra de Deise, mítica e misteriosa."
        },
        on: {
            look: "\nA tela exibe um prompt retrô, como se esperasse sua alma.",
            use: "\nEle pede a senha... é meu próprio computador, mas minha mente falha, que dor de cabeça, nao sei a senha...",
            talk: "\nO cooler canta em ruídos cósmicos.",
            check: "\nProtegido. Deise não deixava brechas."
        },
        unlocked: {
            look: "\nA interface do HericOS é uma trip lisérgica. Será que a gente tomou cogumelo ontem?",
            use: "\nProgramas antigos funcionam como novos. O tempo não passou aqui.",
            talk: "\nRespostas lentas, mas carregadas de memória.",
            check: "\nScripts de hacking intactos. Organização de outro mundo."
        },
        hacked: {
            look: "\nCódigos saltam na tela como se estivessem vivos. Matrix em technicolor.",
            use: "\n Você chutou o computador ele pisca luzes neon e parece vocẽ desbloqueou o acesso ao sistema.",
            talk: "\nO computador está com um sistema de segurança muito forte, preciso desbloquear o sistema para poder usar o computador.",
            check: "\nKernel comprometido com estilo."
        },
        paired: {
            look: "\nO PC pulsa no ritmo da JBL. Um casamento perfeito.",
            use: "\nSom calibrado. O palco está pronto.",
            talk: "\nSintonia fina entre passado e presente.",
            check: "\nPareado. Só falta o som."
        },
        playing: {
            look: "\nO computador libera Lésbica Futurista na JBL. O tempo se curva.",
            use: "\nAs ondas sonoras limpam a poeira de cada canto.",
            talk: "\nA música faz o notebook rejuvenescer a cada batida.",
            check: "\nReprodução ativa. Volume no talo. Emoção no limite."
        }
    }
    
}; 