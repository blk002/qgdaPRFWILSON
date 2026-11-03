export type QuestionCategory = 'CTB' | 'CONTRAN';

export interface BaseLegalQuestion {
  id: string;
  category: QuestionCategory;
  topic: string;
  legalBasis: string;
  answer: boolean; // true = CERTO, false = ERRADO
  explanation: string;
  coreStatements: string[]; // Diverse base phrasings of the same legal rule
}

export interface ActiveRoundQuestion {
  id: string;
  uniqueHash: string;
  category: QuestionCategory;
  topic: string;
  legalBasis: string;
  statement: string;
  answer: boolean;
  explanation: string;
  wasAiRewritten?: boolean;
}

export const QUESTIONS_BANK: BaseLegalQuestion[] = [
  // ==================== CTB (LEI Nº 9.503/1997 E ATUALIZAÇÕES) ====================
  {
    id: 'ctb-01',
    category: 'CTB',
    topic: 'Normas Gerais de Circulação e Conduta',
    legalBasis: 'Art. 29, III, do CTB (Lei nº 9.503/1997)',
    answer: true,
    explanation:
      'CORRETO. Pelo Art. 29, III, do CTB (com redação da Lei 14.071/2020), quando veículos, transitando por fluxos que se cruzem, se aproximarem de local não sinalizado, terá preferência de passagem: a) no caso de apenas um fluxo ser proveniente de rodovia, aquele que estiver circulando por ela; b) no caso de rotatória, aquele que estiver circulando por ela; c) nos demais casos, o que vier pela direita do condutor.',
    coreStatements: [
      'Em interseções desprovidas de sinalização específica, caso apenas um dos fluxos que se cruzam seja oriundo de rodovia, a preferência de passagem pertencerá ao veículo que nela estiver trafegando.',
      'Quando dois veículos se aproximam de um cruzamento não sinalizado e somente um deles circula por rodovia, este detém a preferência legal de passagem sobre o demais.',
      'Na ausência de sinalização em um cruzamento viário, o condutor que trafega por uma rodovia tem prioridade de passagem em relação ao fluxo proveniente de via de outra natureza.',
    ],
  },
  {
    id: 'ctb-02',
    category: 'CTB',
    topic: 'Habilitação e Validade da CNH',
    legalBasis: 'Art. 147, § 2º, do CTB (Lei nº 14.071/2020)',
    answer: false,
    explanation:
      'ERRADO. Conforme o Art. 147, § 2º, do CTB, o exame de aptidão física e mental deve ser renovado a cada 10 anos para condutores com idade inferior a 50 anos; a cada 5 anos para condutores com idade igual ou superior a 50 e inferior a 70 anos; e a cada 3 anos para condutores com idade igual ou superior a 70 anos.',
    coreStatements: [
      'O prazo de renovação do exame de aptidão física e mental para motoristas com idade entre 50 e 69 anos completos é de dez anos, reduzindo-se para cinco anos apenas após os 70 anos.',
      'Condutores que possuem 55 anos de idade fazem jus à renovação decenal (a cada 10 anos) do exame de aptidão física e mental exigido para a CNH.',
      'Pelas regras vigentes de validade da CNH, a periodicidade de cinco anos para renovação do exame médico aplica-se exclusivamente aos condutores com idade igual ou superior a 70 anos.',
    ],
  },
  {
    id: 'ctb-03',
    category: 'CTB',
    topic: 'Penalidades e Suspensão do Direito de Dirigir',
    legalBasis: 'Art. 261, § 1º, do CTB',
    answer: true,
    explanation:
      'CORRETO. Nos termos do Art. 261, I, do CTB, no período de 12 meses, a suspensão por acúmulo de pontos ocorre com: 20 pontos (caso constem 2 ou mais infrações gravíssimas), 30 pontos (caso conste 1 infração gravíssima) ou 40 pontos (caso não conste nenhuma infração gravíssima). Para o condutor que exerce atividade remunerada (EAR), o limite é sempre de 40 pontos independentemente da natureza das infrações (§ 5º).',
    coreStatements: [
      'O motorista que não exerce atividade remunerada ao veículo terá instaurado processo de suspensão do direito de dirigir ao atingir 30 pontos em 12 meses, caso haja exatamente uma infração de natureza gravíssima em seu prontuário nesse período.',
      'Na contagem de pontos em doze meses para condutor sem EAR na CNH, a existência de uma única infração gravíssima fixa o teto para suspensão do direito de dirigir em trinta pontos.',
      'Para o condutor não profissional, acumular trinta pontos no intervalo de um ano acarreta a penalidade de suspensão da CNH quando figurar em seu registro apenas uma infração gravíssima.',
    ],
  },
  {
    id: 'ctb-04',
    category: 'CTB',
    topic: 'Crimes de Trânsito em Espécie',
    legalBasis: 'Art. 306 do CTB',
    answer: false,
    explanation:
      'ERRADO. O crime de embriaguez ao volante (Art. 306 do CTB) é crime de perigo abstrato, mas exige concentração igual ou superior a 6 decigramas de álcool por litro de sangue OU igual ou superior a 0,3 miligrama de álcool por litro de ar alveolar, ou ainda sinais que indiquem alteração da capacidade psicomotora. A marca de 0,15 mg/L configura apenas infração administrativa (Art. 165), salvo se houver sinais de alteração psicomotora.',
    coreStatements: [
      'A simples constatação, por etilômetro, de concentração de 0,15 miligrama de álcool por litro de ar alveolar, sem outros sinais de alteração psicomotora, é suficiente para tipificar o crime de embriaguez ao volante previsto no Art. 306 do CTB.',
      'Configura crime de trânsito, independentemente de outros sintomas clínicos, o resultado de teste de alcoolemia que aponte exatamente 0,18 mg de álcool por litro de ar alveolar expelido pelos pulmões.',
      'Para o enquadramento criminal no delito de conduzir veículo sob influência de álcool pelo critério exclusivamente quantitativo do etilômetro, basta atingir a marca de 0,20 mg/L de ar alveolar.',
    ],
  },
  {
    id: 'ctb-05',
    category: 'CTB',
    topic: 'Uso de Luzes em Rodovias',
    legalBasis: 'Art. 40, I e § 2º, do CTB',
    answer: true,
    explanation:
      'CORRETO. De acordo com o Art. 40, I e § 2º, do CTB, os veículos que não dispuserem de luzes de rodagem diurna (DRL) deverão manter acesos os faróis nas rodovias de pista simples situadas fora dos perímetros urbanos, mesmo durante o dia.',
    coreStatements: [
      'Veículos desprovidos de luzes de rodagem diurna (DRL) estão obrigados a manter o farol baixo aceso durante o dia quando circularem por rodovias de pista simples localizadas fora do perímetro urbano.',
      'Em rodovias de pista simples fora da área urbana, exige-se o acionamento diurno dos faróis de luz baixa para os automóveis que não contem com farol de rodagem diurna (DRL).',
      'Durante o período diurno, a obrigatoriedade de manter os faróis baixos acesos em rodovias aplica-se aos veículos sem tecnologia DRL que trafeguem em trechos de pista simples fora dos perímetros urbanos.',
    ],
  },
  {
    id: 'ctb-06',
    category: 'CTB',
    topic: 'Transporte de Crianças em Motocicletas',
    legalBasis: 'Art. 244, V, do CTB (Lei nº 14.071/2020)',
    answer: false,
    explanation:
      'ERRADO. A Lei nº 14.071/2020 alterou o Art. 244, V, do CTB: constitui infração gravíssima (com suspensão do direito de dirigir) conduzir motocicleta, motoneta ou ciclomotor transportando criança menor de 10 (dez) anos de idade ou que não tenha, nas circunstâncias, condições de cuidar da própria segurança (antes era menor de 7 anos).',
    coreStatements: [
      'É permitido pelo Código de Trânsito Brasileiro o transporte de criança de oito anos de idade em motocicleta, desde que ela utilize capacete certificado e alcance os pedais de apoio.',
      'A idade mínima legal para que uma criança possa ser transportada como passageira em motoneta ou motocicleta é de sete anos completos, conforme a redação atual do Art. 244 do CTB.',
      'Conduzir motocicleta transportando passageiro de nove anos de idade não configura infração de trânsito, contanto que a criança tenha porte físico para firmar-se no veículo.',
    ],
  },
  {
    id: 'ctb-07',
    category: 'CTB',
    topic: 'Exame Toxicológico Periódico',
    legalBasis: 'Art. 148-A e Art. 165-B do CTB (Lei nº 14.599/2023)',
    answer: true,
    explanation:
      'CORRETO. Conforme os Arts. 148-A e 165-B do CTB (atualizados pela Lei nº 14.599/2023), os condutores das categorias C, D e E com idade inferior a 70 anos devem realizar exame toxicológico periódico a cada 2 anos e 6 meses. Conduzir qualquer veículo sem ter realizado o exame após 30 dias do vencimento do prazo constitui infração gravíssima.',
    coreStatements: [
      'Condutores habilitados nas categorias C, D ou E com menos de 70 anos de idade devem submeter-se a novo exame toxicológico a cada período de dois anos e seis meses, contados da obtenção ou renovação da CNH.',
      'A periodicidade do exame toxicológico intermediário para motoristas das categorias C, D e E com idade inferior a setenta anos é de trinta meses (dois anos e meio), independentemente de exercerem atividade remunerada.',
      'Para manter a regularidade da habilitação nas categorias C, D e E antes dos 70 anos, exige-se a realização de exame toxicológico de larga janela de detecção a cada dois anos e seis meses.',
    ],
  },
  {
    id: 'ctb-08',
    category: 'CTB',
    topic: 'Conversão à Direita diante de Semáforo Vermelho',
    legalBasis: 'Art. 44-A do CTB (Lei nº 14.071/2020)',
    answer: true,
    explanation:
      'CORRETO. O Art. 44-A do CTB estabelece que é livre o movimento de conversão à direita diante de sinal vermelho do semáforo onde houver sinalização indicativa que permita essa conversão, observados os Arts. 44, 45 e 70 (preferência do pedestre e dos demais veículos).',
    coreStatements: [
      'É lícita a manobra de conversão à direita mesmo com o foco semafórico na cor vermelha, desde que exista sinalização específica no local autorizando expressamente esse movimento e seja respeitada a preferência dos pedestres.',
      'Diante de indicação luminosa vermelha do semáforo, o condutor poderá efetuar a conversão à direita se houver placa indicativa permitindo tal manobra, assegurada a prioridade de travessia de pedestres e ciclistas.',
      'A livre conversão à direita sob sinal vermelho semafórico depende, segundo o Art. 44-A do CTB, da presença de sinalização regulamentadora ou indicativa no local e do respeito à segurança dos pedestres.',
    ],
  },
  {
    id: 'ctb-09',
    category: 'CTB',
    topic: 'Velocidades Máximas em Vias Rurais sem Sinalização',
    legalBasis: 'Art. 61, § 1º, II, do CTB',
    answer: false,
    explanation:
      'ERRADO. Segundo o Art. 61, § 1º, II, do CTB, nas rodovias de pista simples onde não existir sinalização regulamentadora, a velocidade máxima é de 100 km/h para automóveis, camionetas, caminhonetes e motocicletas, e 90 km/h para os demais veículos. Nas estradas (vias rurais não pavimentadas), o limite é de 60 km/h para todos os veículos.',
    coreStatements: [
      'Nas rodovias de pista simples desprovidas de placas de regulamentação de velocidade, o limite máximo permitido para automóveis, camionetas e motocicletas é de 110 km/h.',
      'Onde não houver sinalização regulamentadora em rodovia de pista simples, automóveis e caminhonetes podem desenvolver velocidade de até 110 km/h sem incorrer em infração.',
      'O Código de Trânsito Brasileiro fixa em 80 km/h a velocidade máxima padrão nas estradas rurais não pavimentadas para automóveis e motocicletas quando ausente sinalização específica.',
    ],
  },
  {
    id: 'ctb-10',
    category: 'CTB',
    topic: 'Advertência por Escrito',
    legalBasis: 'Art. 267 do CTB (Lei nº 14.071/2020)',
    answer: true,
    explanation:
      'CORRETO. Conforme a nova redação do Art. 267 do CTB dada pela Lei 14.071/2020, deverá ser imposta a penalidade de advertência por escrito à infração de natureza leve ou média, passível de ser punida com multa, caso o infrator não tenha cometido nenhuma outra infração nos últimos 12 (doze) meses (trata-se de ato vinculado, não mais discricionário).',
    coreStatements: [
      'A conversão da multa em penalidade de advertência por escrito para infrações de natureza leve ou média é obrigatória quando o condutor não registrar nenhuma outra infração nos doze meses anteriores.',
      'Cometida infração leve ou média por motorista que não possua qualquer outro registro infracional nos últimos 12 meses, a autoridade de trânsito deverá impor a penalidade de advertência por escrito em substituição à multa.',
      'Não há margem de discricionariedade para a autoridade de trânsito: preenchidos os requisitos de infração leve ou média e ausência de outras infrações nos últimos 12 meses, impõe-se obrigatoriamente a advertência por escrito.',
    ],
  },
  {
    id: 'ctb-11',
    category: 'CTB',
    topic: 'Retenção e Remoção do Veículo por Licenciamento',
    legalBasis: 'Art. 271, § 9º-A, do CTB (Lei nº 14.229/2021)',
    answer: true,
    explanation:
      'CORRETO. Pelo Art. 230, V, e Art. 271, § 9º-A, do CTB, quando a irregularidade puder ser sanada no local (inclusive mediante o pagamento dos débitos e encargos de licenciamento no próprio ato da abordagem por meio eletrônico), o veículo será liberado tão logo seja regularizada a situação, não cabendo sua remoção ao depósito.',
    coreStatements: [
      'Não caberá a medida administrativa de remoção do veículo ao pátio quando a irregularidade referente à falta de licenciamento anual for sanada no próprio local da fiscalização, inclusive mediante quitação eletrônica dos débitos.',
      'Se o condutor abordado com licenciamento atrasado providenciar a regularização e o pagamento dos débitos pendentes ainda durante o ato de fiscalização, o veículo deverá ser liberado sem remoção ao depósito.',
      'A remoção do veículo deixa de ser aplicada pela fiscalização quando o vício constatado — inclusive de caráter documental ou de licenciamento — for integralmente sanado no local da abordagem.',
    ],
  },
  {
    id: 'ctb-12',
    category: 'CTB',
    topic: 'Ultrapassagem pelo Acostamento e em Pontes',
    legalBasis: 'Art. 202, I, e Art. 203, II, do CTB',
    answer: false,
    explanation:
      'ERRADO. Ultrapassar pelo acostamento (Art. 202, I) é infração gravíssima com multa multiplicada por 5 (R$ 1.467,35), mas NÃO prevê suspensão direta do direito de dirigir no preceito secundário. Já ultrapassar pela contramão em pontes, viadutos ou túneis (Art. 203, II) é infração gravíssima com multa multiplicada por 5.',
    coreStatements: [
      'A conduta de efetuar ultrapassagem pelo acostamento constitui infração de natureza grave sujeita a multa simples, sem aplicação de fator multiplicador sobre o valor da penalidade.',
      'Segundo o CTB, ultrapassar outro veículo pelo acostamento em rodovia acarreta multa de natureza gravíssima multiplicada por dez vezes e suspensão imediata da CNH por doze meses.',
      'Realizar ultrapassagem utilizando a faixa de acostamento é classificado pelo Código de Trânsito Brasileiro como infração média, salvo se resultar em sinistro.',
    ],
  },
  {
    id: 'ctb-13',
    category: 'CTB',
    topic: 'Substituição de Pena Privativa de Liberdade em Crimes de Trânsito',
    legalBasis: 'Art. 312-B do CTB (Lei nº 14.071/2020)',
    answer: true,
    explanation:
      'CORRETO. O Art. 312-B do CTB estabelece que aos crimes previstos no § 3º do art. 302 (homicídio culposo na direção de veículo automotor sob influência de álcool ou outra substância psicoativa) e no § 2º do art. 303 (lesão corporal culposa grave ou gravíssima sob influência de álcool) NÃO se aplica o disposto no inciso I do caput do art. 44 do Código Penal (vedação de substituição por penas restritivas de direitos).',
    coreStatements: [
      'No crime de homicídio culposo na direção de veículo automotor praticado por condutor sob a influência de álcool, o CTB veda expressamente a substituição da pena privativa de liberdade por pena restritiva de direitos.',
      'É incabível a conversão da pena de reclusão em penas restritivas de direitos para o motorista condenado por lesão corporal culposa de natureza grave ou gravíssima cometida sob efeito de álcool na direção de veículo.',
      'O Art. 312-B do CTB proíbe que o juiz substitua a pena privativa de liberdade por restritiva de direitos nos casos de homicídio culposo ou lesão corporal grave/gravíssima no trânsito qualificados pela embriaguez ao volante.',
    ],
  },
  {
    id: 'ctb-14',
    category: 'CTB',
    topic: 'Requisitos para Habilitação nas Categorias D e E',
    legalBasis: 'Art. 145 do CTB',
    answer: false,
    explanation:
      'ERRADO. Para habilitar-se nas categorias D e E, o candidato deve ser maior de 21 (vinte e um) anos, e não 18 anos. Além disso, para a categoria D, exige-se estar habilitado no mínimo há 2 anos na categoria B ou no mínimo há 1 ano na categoria C.',
    coreStatements: [
      'O condutor que possua 19 anos de idade e esteja habilitado há um ano na categoria C preenche o requisito etário legal para requerer a mudança para a categoria D.',
      'Basta ter completado 18 anos de idade e possuir dois anos de habilitação na categoria B para que o motorista possa habilitar-se na categoria D para transporte coletivo de passageiros.',
      'A idade mínima exigida pelo Código de Trânsito Brasileiro para obtenção das categorias D e E é de 20 anos completos na data do requerimento.',
    ],
  },

  // ==================== RESOLUÇÕES DO CONTRAN ====================
  {
    id: 'contran-01',
    category: 'CONTRAN',
    topic: 'Ciclomotores, Bicicletas Elétricas e Autopropelidos',
    legalBasis: 'Resolução CONTRAN nº 996/2023',
    answer: true,
    explanation:
      'CORRETO. De acordo com a Resolução CONTRAN nº 996/2023, os equipamentos de mobilidade individual autopropelidos (como patinetes e monociclos elétricos) devem ter velocidade máxima de fabricação não superior a 32 km/h, potência nominal máxima de até 1000 W (ou 4000 W para monociclos autoequilibrados) e largura não superior a 70 cm, estando dispensados de registro, licenciamento e CNH/ACC.',
    coreStatements: [
      'Nos termos da Resolução CONTRAN nº 996/2023, os equipamentos de mobilidade individual autopropelidos com velocidade máxima de fabricação até 32 km/h estão dispensados de registro, emplacamento e habilitação (CNH ou ACC).',
      'Segundo a regulamentação do CONTRAN sobre micromobilidade (Res. 996/2023), não se exige CNH, ACC nem licenciamento para a condução de equipamentos autopropelidos que respeitem o limite construtivo de 32 km/h e largura máxima de 70 cm.',
      'Diferentemente dos ciclomotores, os veículos classificados como equipamentos de mobilidade individual autopropelidos pela Resolução nº 996/2023 do CONTRAN independem de registro no órgão de trânsito e de habilitação do condutor.',
    ],
  },
  {
    id: 'contran-02',
    category: 'CONTRAN',
    topic: 'Fiscalização da Alcoolemia e Etilômetro',
    legalBasis: 'Resolução CONTRAN nº 432/2013 (Art. 5º e Anexo I)',
    answer: false,
    explanation:
      'ERRADO. Pela Resolução CONTRAN nº 432/2013, o auto de infração (e eventual configuração de crime) considera o "Valor Considerado" (VC), que resulta da subtração do erro máximo admissível da medição realizada (MR). Porém, qualquer medição realizada igual ou superior a 0,05 mg/L já configura infração administrativa (pois descontado o erro de 0,04 mg/L resulta em VC >= 0,01 mg/L). Não há tolerância de 0,10 mg/L no bafômetro!',
    coreStatements: [
      'Segundo a Resolução CONTRAN nº 432/2013, a infração administrativa por alcoolemia somente resta configurada quando a medição realizada pelo etilômetro for igual ou superior a 0,10 mg de álcool por litro de ar alveolar.',
      'A margem de tolerância técnica prevista pelo CONTRAN para o teste do etilômetro permite que o condutor apresente medição realizada de até 0,09 mg/L sem sofrer autuação administrativa.',
      'Conforme a tabela de valores referenciais da Resolução nº 432/2013 do CONTRAN, medições no etilômetro inferiores a 0,10 mg/L são descartadas para fins de autuação no Art. 165 do CTB.',
    ],
  },
  {
    id: 'contran-03',
    category: 'CONTRAN',
    topic: 'Processo Administrativo de Trânsito e Notificações',
    legalBasis: 'Resolução CONTRAN nº 918/2022',
    answer: true,
    explanation:
      'CORRETO. De acordo com a Resolução CONTRAN nº 918/2022 (em consonância com o Art. 282, § 6º, do CTB), na hipótese de retorno de notificação por desatualização do endereço do proprietário do veículo ou por recusa em recebê-la, a notificação será considerada válida para todos os efeitos.',
    coreStatements: [
      'Conforme a Resolução CONTRAN nº 918/2022, caso a notificação da autuação ou da penalidade seja devolvida por estar desatualizado o endereço cadastral do proprietário do veículo, ela será considerada válida para todos os efeitos legais.',
      'A devolução postal da notificação de trânsito motivada pela falta de atualização do endereço do proprietário junto ao órgão executivo de trânsito não invalida o ato, reputando-se válida a notificação nos termos da Resolução nº 918/2022 do CONTRAN.',
      'Nos procedimentos regidos pela Resolução CONTRAN nº 918/2022, tanto a recusa no recebimento quanto a desatualização do endereço cadastral do proprietário tornam a notificação plenamente válida para fins de contagem de prazos.',
    ],
  },
  {
    id: 'contran-04',
    category: 'CONTRAN',
    topic: 'Uso de Capacete de Segurança para Motociclistas',
    legalBasis: 'Resolução CONTRAN nº 940/2022',
    answer: false,
    explanation:
      'ERRADO. Segundo a Resolução CONTRAN nº 940/2022, no período noturno, a viseira ou os óculos de proteção utilizados pelo condutor e passageiro de motocicleta devem ser obrigatoriamente no padrão CRISTAL (transparente), sendo vedado o uso de viseira fumê, espelhada ou colorida à noite.',
    coreStatements: [
      'A Resolução CONTRAN nº 940/2022 autoriza a utilização de viseira fumê ou espelhada em capacetes motociclísticos durante o período noturno, desde que a via pública disponha de iluminação artificial contínua.',
      'É permitido ao condutor de motocicleta trafegar à noite utilizando viseira levemente escurecida (fumê), contanto que o capacete possua selo do INMETRO e películas retrorrefletivas nas laterais.',
      'De acordo com as normas do CONTRAN sobre equipamentos de proteção para motociclistas (Res. 940/2022), a restrição ao uso de viseira fumê limita-se às rodovias rurais desprovidas de iluminação pública.',
    ],
  },
  {
    id: 'contran-05',
    category: 'CONTRAN',
    topic: 'Transporte de Crianças em Veículos Automotores (Dispositivos de Retenção)',
    legalBasis: 'Resolução CONTRAN nº 819/2021',
    answer: true,
    explanation:
      'CORRETO. Pela Resolução CONTRAN nº 819/2021 (alinhada ao Art. 64 do CTB), as crianças com idade inferior a 10 anos que não tenham atingido 1,45 m de altura devem ser transportadas nos bancos traseiros usando dispositivo de retenção adequado. Excepcionalmente, crianças com mais de 4 anos e até 7 anos e meio devem utilizar o assento de elevação (booster); e acima de 7 anos e meio até 10 anos (com menos de 1,45 m) utilizam o cinto de segurança do veículo no banco traseiro.',
    coreStatements: [
      'Segundo a regulamentação do CONTRAN sobre dispositivos de retenção infantil (Res. 819/2021), crianças com idade inferior a 10 anos que já tenham atingido 1,45 m de altura estão autorizadas a utilizar apenas o cinto de segurança do veículo.',
      'O critério de estatura de 1,45 m dispensa o uso de dispositivos especiais de retenção (como cadeirinha ou assento de elevação) para menores de dez anos, permanecendo obrigatório o uso do cinto de segurança conforme a Resolução CONTRAN nº 819/2021.',
      'Nos termos da Resolução nº 819/2021 do CONTRAN, a obrigatoriedade de transporte nos bancos traseiros com dispositivo de retenção específico cessa antes dos 10 anos caso a criança atinja a altura mínima de 1,45 metro.',
    ],
  },
  {
    id: 'contran-06',
    category: 'CONTRAN',
    topic: 'Aprendizagem, Habilitação e ACC',
    legalBasis: 'Resolução CONTRAN nº 789/2020',
    answer: false,
    explanation:
      'ERRADO. Conforme a Resolução CONTRAN nº 789/2020, a Licença de Aprendizagem de Direção Veicular (LADV) tem validade restrita à Unidade da Federação em que foi expedida e exige que o candidato esteja acompanhado por um instrutor de trânsito credenciado (não podendo ser acompanhado por qualquer condutor habilitado). Além disso, se o candidato for flagrado conduzindo desacompanhado do instrutor, a LADV será suspensa por 6 meses.',
    coreStatements: [
      'A Resolução CONTRAN nº 789/2020 permite que o candidato portador de Licença de Aprendizagem de Direção Veicular (LADV) realize aulas práticas acompanhado por qualquer condutor habilitado há mais de três anos na mesma categoria.',
      'Durante a vigência da LADV, caso o aprendiz seja surpreendido conduzindo o veículo de aprendizagem sem a presença do instrutor credenciado, sofrerá apenas advertência verbal, sem suspensão da licença.',
      'De acordo com a Resolução nº 789/2020 do CONTRAN, a Licença de Aprendizagem de Direção Veicular (LADV) possui validade em todo o território nacional, permitindo aulas práticas em qualquer estado da Federação.',
    ],
  },
  {
    id: 'contran-07',
    category: 'CONTRAN',
    topic: 'Áreas de Luminância e Películas nos Vidros (Insulfilm)',
    legalBasis: 'Resolução CONTRAN nº 960/2022 (alterada pela Res. 989/2022)',
    answer: true,
    explanation:
      'CORRETO. Pela Resolução CONTRAN nº 960/2022 (com alterações da Res. 989/2022), a transmissão luminosa do conjunto vidro-película não pode ser inferior a 70% para o para-brisa e para os vidros laterais dianteiros (indispensáveis à dirigibilidade), sendo proibido o uso de películas com bolhas na área crítica de visão do condutor.',
    coreStatements: [
      'Conforme a Resolução CONTRAN nº 960/2022 (atualizada pela Res. 989/2022), a transmitância luminosa mínima exigida para o conjunto vidro-película no para-brisa e nos vidros laterais dianteiros é de 70%, sendo vedada a existência de bolhas na área crítica de visão.',
      'As normas atuais do CONTRAN sobre transparência de vidros automotivos exigem índice mínimo de 70% de transmissão luminosa nos vidros laterais dianteiros e proíbem películas que apresentem bolhas nas áreas indispensáveis à dirigibilidade.',
      'Segundo a regulamentação do CONTRAN (Res. 960/2022), tanto o para-brisa incolor quanto os vidros das portas dianteiras devem assegurar no mínimo 70% de passagem de luz visível.',
    ],
  },
  {
    id: 'contran-08',
    category: 'CONTRAN',
    topic: 'Placas de Identificação Veicular (Padrão Mercosul)',
    legalBasis: 'Resolução CONTRAN nº 969/2022',
    answer: false,
    explanation:
      'ERRADO. Segundo a Resolução CONTRAN nº 969/2022, os veículos que ainda possuem placas no modelo cinza anterior (três letras e quatro números) NÃO são obrigados a trocá-las imediatamente pelo padrão PIV (Mercosul), salvo nos casos de transferência de município/UF, mudança de categoria, furto, extravio, dano da placa ou quando houver necessidade de segunda placa traseira.',
    coreStatements: [
      'A Resolução CONTRAN nº 969/2022 impõe a substituição compulsória imediata de todas as placas cinzas do modelo antigo pelo padrão PIV (Mercosul) como condição para o licenciamento anual do veículo, mesmo sem mudança de município ou dano à placa.',
      'Veículos equipados com placas no modelo anterior (cinza com tarjeta) estão impedidos de circular em rodovias federais até que realizem a migração voluntária para a Placa de Identificação Veicular padrão Mercosul, conforme a Res. 969/2022.',
      'Pelas regras da Resolução nº 969/2022 do CONTRAN, a simples transferência de propriedade de um veículo dentro do mesmo município e da mesma categoria obriga sempre a troca das placas antigas em perfeito estado pelo padrão Mercosul.',
    ],
  },
  {
    id: 'contran-09',
    category: 'CONTRAN',
    topic: 'Fiscalização de Velocidade por Medidores (Radares)',
    legalBasis: 'Resolução CONTRAN nº 798/2020',
    answer: true,
    explanation:
      'CORRETO. De acordo com a Resolução CONTRAN nº 798/2020, é vedada a instalação e utilização de medidores de velocidade (fixos ou portáteis) de forma oculta, camuflada ou sem visibilidade para os condutores, devendo o agente de trânsito estar devidamente uniformizado ao operar medidor do tipo portátil.',
    coreStatements: [
      'A Resolução CONTRAN nº 798/2020 proíbe que os equipamentos medidores de velocidade, inclusive os do tipo portátil operados por agentes de trânsito, sejam utilizados de modo oculto ou camuflado atrás de árvores, marquises ou passarelas.',
      'Na fiscalização eletrônica de velocidade regida pela Resolução nº 798/2020 do CONTRAN, exige-se visibilidade ostensiva tanto dos medidores fixos quanto dos portáteis, sendo vedado ao agente ocultar-se para autuar condutores.',
      'Nos termos da Resolução CONTRAN nº 798/2020, o uso de radar portátil demanda que o equipamento e o agente de fiscalização uniformizado estejam visíveis aos usuários da via.',
    ],
  },
  {
    id: 'contran-10',
    category: 'CONTRAN',
    topic: 'Transporte de Cargas Indivisíveis e AET',
    legalBasis: 'Resolução CONTRAN nº 882/2021',
    answer: true,
    explanation:
      'CORRETO. A Resolução CONTRAN nº 882/2021 fixa os limites de pesos e dimensões para veículos que transitem por vias terrestres: a largura máxima padrão é de 2,60 m e a altura máxima padrão é de 4,40 m (salvo exceções regulamentadas), exigindo-se Autorização Especial de Trânsito (AET) para cargas indivisíveis que excedam esses limites.',
    coreStatements: [
      'De acordo com a Resolução CONTRAN nº 882/2021, os veículos de carga em circulação regular nas vias terrestres sem Autorização Especial de Trânsito (AET) devem respeitar os limites máximos gerais de 2,60 metros de largura e 4,40 metros de altura.',
      'A regulamentação de pesos e dimensões do CONTRAN (Res. 882/2021) estabelece, como regra geral para veículos não detentores de AET ou AE, a largura máxima de 2,60 m e a altura máxima de 4,40 m.',
      'Salvo hipóteses específicas previstas em norma, o limite dimensional padrão de largura veicular nas vias públicas brasileiras é de 2,60 m e o de altura é de 4,40 m, conforme dispõe a Resolução CONTRAN nº 882/2021.',
    ],
  },
  {
    id: 'contran-11',
    category: 'CONTRAN',
    topic: 'Sinalização Viária e Semáforos',
    legalBasis: 'Resolução CONTRAN nº 973/2022 (MBST)',
    answer: false,
    explanation:
      'ERRADO. Segundo o Manual Brasileiro de Sinalização de Trânsito (Resolução CONTRAN nº 973/2022) e o Anexo II do CTB, as placas de Regulamentação têm a forma circular (com exceção de R-1 "Parada Obrigatória", que é octogonal, e R-2 "Dê a Preferência", que é triangular), fundo branco, tarja vermelha e símbolos pretos. As placas amarelas quadradas (em diagonal) são de Advertência, que têm caráter de alerta/recomendação, e não imperativo punitivo direto.',
    coreStatements: [
      'Conforme o Manual Brasileiro de Sinalização de Trânsito instituído pela Resolução CONTRAN nº 973/2022, a placa "Dê a Preferência" (R-2) classifica-se como sinalização vertical de advertência, possuindo fundo amarelo e orla preta.',
      'Nos termos da Resolução CONTRAN nº 973/2022, todas as placas de regulamentação possuem formato estritamente circular, sem qualquer exceção geométrica no Sistema Nacional de Trânsito.',
      'Pelas diretrizes da Resolução nº 973/2022 do CONTRAN, o desrespeito isolado a uma placa vertical de advertência de cor amarela constitui, por si só, infração administrativa autônoma por desobediência à sinalização.',
    ],
  },
  {
    id: 'contran-12',
    category: 'CONTRAN',
    topic: 'Transporte de Cargas ou Bicicletas em Veículos de Passageiros',
    legalBasis: 'Resolução CONTRAN nº 955/2022',
    answer: true,
    explanation:
      'CORRETO. De acordo com a Resolução CONTRAN nº 955/2022, o transporte de bicicletas na parte externa de veículos de passageiros (como em suporte traseiro/engate) exige a instalação de segunda placa traseira de identificação caso o equipamento ou a bicicleta encubra total ou parcialmente a placa original do veículo.',
    coreStatements: [
      'Nos termos da Resolução CONTRAN nº 955/2022, quando o transporte de bicicleta em suporte instalado na traseira de automóvel encobrir a visualização da placa de identificação original, torna-se obrigatório o uso de segunda placa traseira.',
      'O transporte externo de bicicletas na parte posterior de veículos de passageiros é permitido pela Resolução nº 955/2022 do CONTRAN, exigindo-se régua de sinalização e segunda placa caso haja obstrução das luzes ou da placa original.',
      'Segundo a Resolução CONTRAN nº 955/2022, a obstrução parcial ou total da placa traseira por suporte de bicicleta afixado no engate obriga o proprietário a utilizar segunda placa de identificação devidamente lacrada/registrada.',
    ],
  },
  {
    id: 'contran-13',
    category: 'CONTRAN',
    topic: 'Equipamentos Obrigatórios e Extintor de Incêndio',
    legalBasis: 'Resolução CONTRAN nº 919/2022',
    answer: false,
    explanation:
      'ERRADO. Pela Resolução CONTRAN nº 919/2022 (que consolidou a Res. 556/2015), o uso do extintor de incêndio é FACULTATIVO para automóveis, utilitários, camionetas, caminhonetes e triciclos de cabine fechada. Permanece OBRIGATÓRIO apenas para caminhões, caminhões-tratores, micro-ônibus, ônibus, veículos de transporte de produtos inflamáveis/perigosos e veículos utilizados no transporte coletivo de passageiros.',
    coreStatements: [
      'De acordo com a Resolução CONTRAN nº 919/2022, o extintor de incêndio com carga de pó ABC voltou a ser equipamento obrigatório para todos os automóveis de passeio e caminhonetes que circulem em rodovias federais.',
      'A ausência de extintor de incêndio em automóvel particular de passeio configura infração grave por falta de equipamento obrigatório, conforme estabelece a Resolução nº 919/2022 do CONTRAN.',
      'Nos termos da Resolução CONTRAN nº 919/2022, tanto os caminhões quanto os automóveis de uso particular estão obrigados a portar extintor de incêndio dentro do prazo de validade.',
    ],
  },
  {
    id: 'contran-14',
    category: 'CONTRAN',
    topic: 'Exame de Direção Veicular e Faltas Eliminatórias',
    legalBasis: 'Resolução CONTRAN nº 789/2020 (Art. 18 e 19)',
    answer: true,
    explanation:
      'CORRETO. Segundo a Resolução CONTRAN nº 789/2020, no Exame de Direção Veicular, o candidato será reprovado se cometer uma falta eliminatória (como avançar a via preferencial, entrar na contramão, subir na calçada ou não usar o capacete/cinto) ou se a soma dos pontos negativos das faltas graves (3 pts), médias (2 pts) e leves (1 pt) ultrapassar 3 (três) pontos.',
    coreStatements: [
      'Conforme a Resolução CONTRAN nº 789/2020, o candidato à primeira habilitação será reprovado no exame prático de direção veicular caso a soma dos pontos negativos das faltas cometidas ultrapasse três pontos ou caso cometa uma falta eliminatória.',
      'No exame prático regido pela Resolução nº 789/2020 do CONTRAN, atingir quatro pontos negativos em decorrência de faltas leves, médias ou graves implica a reprovação do candidato.',
      'Pelas regras de avaliação prática da Resolução CONTRAN nº 789/2020, as faltas graves valem três pontos, as médias dois pontos e as leves um ponto, sendo aprovado o candidato que não cometer falta eliminatória nem exceder o limite de três pontos.',
    ],
  },
];

// Combinatorial Cebraspe Legal Paraphraser to guarantee NO question is EVER 100% equal
const CEBRASPE_PREFIXES_CTB = [
  'Julgue o item a seguir à luz do Código de Trânsito Brasileiro:',
  'Acerca das disposições da Lei nº 9.503/1997 (CTB) e suas atualizações, julgue:',
  'No que se refere às normas gerais, infrações e crimes previstos no CTB, avalie a assertiva:',
  'Considerando a legislação de trânsito vigente aplicável em todo o território nacional, julgue o item:',
  'Com base nas regras positivadas no Código de Trânsito Brasileiro, julgue a proposição:',
  'Sob a ótica da jurisprudência e da literalidade do CTB em vigor, analise a afirmação:',
  'Em situação de fiscalização viária regida pelo Código de Trânsito Brasileiro, julgue:',
];

const CEBRASPE_PREFIXES_CONTRAN = [
  'Julgue o item subsequente de acordo com as Resoluções vigentes do CONTRAN:',
  'À luz da regulamentação normativa expedida pelo Conselho Nacional de Trânsito (CONTRAN), julgue:',
  'No que tange às normas infralegais e resoluções atualizadas do CONTRAN, avalie o item:',
  'Considerando as diretrizes técnicas fixadas em Resolução do CONTRAN, julgue a assertiva:',
  'Com fundamento nos atos normativos do CONTRAN aplicáveis à fiscalização de trânsito, julgue:',
  'A respeito dos parâmetros operacionais regulamentados pelo CONTRAN, analise a proposição:',
  'Em conformidade com o arcabouço normativo do CONTRAN em vigor, julgue o seguinte item:',
];

const CEBRASPE_CONNECTORS = [
  '',
  ' Nessa hipótese normativa, verifica-se a validade integral do preceito descrito.',
  ' Tal diretriz aplica-se de forma vinculante aos órgãos do Sistema Nacional de Trânsito.',
  ' Esse entendimento observa estritamente os parâmetros legais vigentes.',
  ' A referida regra incide nas operações regulares de fiscalização de trânsito.',
  ' Cumpre aos agentes da autoridade de trânsito observar rigorosamente tal comando.',
];

const SYNONYM_PAIRS: Array<[RegExp, string[]]> = [
  [/\bcondutor\b/gi, ['condutor', 'motorista', 'dirigente do veículo', 'condutor abordado']],
  [/\bcondutores\b/gi, ['condutores', 'motoristas', 'usuários habilitados']],
  [/\bveículo\b/gi, ['veículo', 'automotor', 'veículo em circulação']],
  [/\bautoridade de trânsito\b/gi, ['autoridade de trânsito', 'dirigente do órgão executivo de trânsito', 'autoridade competente de trânsito']],
  [/\binfração gravíssima\b/gi, ['infração gravíssima', 'infração de natureza gravíssima', 'ilícito administrativo gravíssimo']],
  [/\bperímetro urbano\b/gi, ['perímetro urbano', 'área urbanizada', 'zona urbana']],
  [/\brodovias\b/gi, ['rodovias', 'vias rurais pavimentadas (rodovias)', 'malha rodoviária']],
  [/\bobrigatório\b/gi, ['obrigatório', 'compulsório', 'exigido por norma']],
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function synthesizeUniqueCebraspeStatement(
  base: BaseLegalQuestion,
  seenStatements: Set<string>,
  rewriteGenerationCount: number
): string {
  const prefixes = base.category === 'CTB' ? CEBRASPE_PREFIXES_CTB : CEBRASPE_PREFIXES_CONTRAN;

  // Try up to 40 combinatorial permutations to guarantee 0% exact match
  for (let attempt = 0; attempt < 40; attempt++) {
    const core = pickRandom(base.coreStatements);
    const prefix = pickRandom(prefixes);
    const suffix = attempt > 2 ? pickRandom(CEBRASPE_CONNECTORS) : '';

    let transformed = core;
    for (const [regex, replacements] of SYNONYM_PAIRS) {
      if (Math.random() > 0.35 || attempt > 5) {
        transformed = transformed.replace(regex, (match) => {
          const chosen = pickRandom(replacements);
          // Preserve initial capitalization if needed
          if (match[0] === match[0].toUpperCase()) {
            return chosen.charAt(0).toUpperCase() + chosen.slice(1);
          }
          return chosen;
        });
      }
    }

    const candidate = `${prefix} ${transformed}${suffix}`.replace(/\s+/g, ' ').trim();
    if (!seenStatements.has(candidate)) {
      seenStatements.add(candidate);
      return candidate;
    }
  }

  // Fallback with unique tactical case number so it is mathematically never 100% identical
  const fallbackCore = pickRandom(base.coreStatements);
  const fallbackPrefix = pickRandom(prefixes);
  const uniqueVariant = `${fallbackPrefix} [Caso Prático #${rewriteGenerationCount + Math.floor(Math.random() * 900 + 100)}] ${fallbackCore}`;
  seenStatements.add(uniqueVariant);
  return uniqueVariant;
}
