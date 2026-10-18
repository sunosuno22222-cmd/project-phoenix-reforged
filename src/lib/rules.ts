export interface PaneleiroRule {
  id: number;
  title: string;
  description: string;
  punishment: string;
}

export const PANELEIRO_RULES_LIST: PaneleiroRule[] = [
  {
    id: 1,
    title: '1. NÃO ALIMENTE O MACACO',
    description: 'Sob hipótese alguma dê moral para o primata que ficar spammando no chat. Ele se descontrola após as 22h, rói os cabos de rede e começa a pingar @everyone sem motivo.',
    punishment: 'Confinamento em sala AFK com áudio desabilitado.'
  },
  {
    id: 2,
    title: '2. PROIBIDO SOPA ÀS 2 DA MANHÃ',
    description: 'O som da panela de pressão tremendo no microfone estourado desestabiliza a call inteira. Quem for pego esquentando caldo de mocotó de madrugada toma mute instantâneo.',
    punishment: 'Mute de 48 horas sem direito a fiança.'
  },
  {
    id: 3,
    title: '3. MICROFONE DE PASTELARIA É CRIME',
    description: 'Entrar em call com microfone que chia igual óleo fervendo, vento batendo na janela ou cachorro latindo na orelha da galera resulta em deportação imediata pro AFK.',
    punishment: 'Mute até comprar um fone de 15 reais na feira.'
  },
  {
    id: 4,
    title: '4. O QUE ACONTECE NA PANELINHA FICA NA PANELINHA',
    description: 'Tirar print das conversas para explanar em servidor rival é alta traição diplomática. O traidor será caçado e imortalizado em meme.',
    punishment: 'Banimento perpétuo com direito a exposed em PowerPoint.'
  }
];
