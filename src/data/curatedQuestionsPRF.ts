import { ActiveRoundQuestion, QuestionCategory } from './questionsBank';

export interface CuratedPRFQuestion {
  id: string;
  category: QuestionCategory;
  topic: string;
  legalBasis: string;
  statement: string;
  answer: boolean;
  explanation: string;
}

export const CURATED_PRF_QUESTIONS: CuratedPRFQuestion[] = [
  {
    "id": "ctb-prf-01",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, III do CTB e ADI 6284 STF",
    "statement": "A Polícia Rodoviária Federal possui competência constitucional e legal para lavrar termo circunstanciado de ocorrência (TCO) nas rodovias e estradas federais.",
    "answer": true,
    "explanation": "CERTO. O Supremo Tribunal Federal (ADI 6284) pacificou a legitimidade da PRF para lavrar TCO no âmbito de sua atuação em rodovias federais."
  },
  {
    "id": "ctb-prf-02",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, III do CTB (Redação Lei 14.071/2020)",
    "statement": "Compete à PRF aplicar a penalidade de suspensão do direito de dirigir quando essa penalidade for prevista de forma específica para a infração cometida em rodovia federal.",
    "answer": true,
    "explanation": "CERTO. Pelo Art. 20, III do CTB (Lei 14.071/2020), a PRF aplica a suspensão do direito de dirigir quando expressamente cominada à infração em rodovia federal."
  },
  {
    "id": "ctb-prf-03",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, XVI do CTB (Redação Lei 14.229/2021)",
    "statement": "A realização de perícia administrativa nos locais de sinistros de trânsito em rodovias federais constitui competência expressamente atribuída à PRF pelo CTB.",
    "answer": true,
    "explanation": "CERTO. O Art. 20, XVI do CTB, incluído pela Lei 14.229/2021, atribui expressamente à PRF a competência para realizar perícia administrativa em locais de sinistros."
  },
  {
    "id": "ctb-prf-04",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20 do CTB",
    "statement": "A competência da PRF para fiscalizar e patrulhar ostensivamente estende-se indistintamente a todas as vias terrestres municipais e estaduais do território nacional.",
    "answer": false,
    "explanation": "ERRADO. A circunscrição legal da PRF abrange rodovias e estradas federais (Art. 20), atuando em outras vias apenas mediante convênio específico."
  },
  {
    "id": "ctb-prf-05",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, V do CTB",
    "statement": "Compete à PRF arrecadar os valores provenientes de estada e remoção de veículos e objetos nas rodovias e estradas federais sob sua circunscrição.",
    "answer": true,
    "explanation": "CERTO. O Art. 20, V do CTB expressamente estabelece como atribuição da PRF arrecadar os valores provenientes de estada e remoção de veículos e objetos."
  },
  {
    "id": "ctb-prf-06",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, XII do CTB",
    "statement": "A PRF não detém competência para credenciar os serviços de guincho e depósito de veículos em rodovias federais, atribuição exclusiva dos DETRANs.",
    "answer": false,
    "explanation": "ERRADO. O Art. 20, XII do CTB expressamente atribui à PRF credenciar os serviços de guincho, depósito e guarda de veículos recolhidos em rodovias federais."
  },
  {
    "id": "ctb-prf-07",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, II e XVIII do CTB",
    "statement": "Compete à PRF assegurar a livre circulação nas rodovias federais, podendo interditar a via e requisitar recursos materiais e humanos em emergências.",
    "answer": true,
    "explanation": "CERTO. Compete à PRF assegurar a livre circulação e a segurança pública nas rodovias federais, executando bloqueios e interdições quando necessário."
  },
  {
    "id": "ctb-prf-08",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, III do CTB",
    "statement": "A lavratura de auto de infração de trânsito por policiais rodoviários federais depende de prévio convênio com o órgão executivo rodoviário da União.",
    "answer": false,
    "explanation": "ERRADO. A competência da PRF para fiscalizar, lavrar autos de infração e aplicar penalidades em rodovias federais é originária e decorre diretamente da lei."
  },
  {
    "id": "ctb-prf-09",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, XI do CTB",
    "statement": "A fiscalização do nível de emissão de poluentes e ruído gerados por veículos automotores em rodovias federais insere-se nas atribuições da PRF.",
    "answer": true,
    "explanation": "CERTO. Conforme o Art. 20, XI do CTB, compete à PRF fiscalizar o nível de emissão de poluentes e ruído produzidos pelos veículos automotores ou pela sua carga."
  },
  {
    "id": "ctb-prf-10",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20 c/c Art. 25 do CTB",
    "statement": "O CTB veda à PRF a celebração de convênios com municípios para o exercício conjunto de atividades de trânsito e compartilhamento de sistemas.",
    "answer": false,
    "explanation": "ERRADO. O Art. 25 do CTB autoriza expressamente os órgãos e entidades do SNT a celebrar convênios delegando atividades previstas no código."
  },
  {
    "id": "ctb-prf-11",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, XVII do CTB",
    "statement": "A PRF tem competência para fiscalizar o cumprimento das normas relativas aos tempos de direção e de descanso dos motoristas profissionais de transporte.",
    "answer": true,
    "explanation": "CERTO. Conforme o Art. 20, XVII do CTB, compete à PRF fiscalizar o cumprimento das normas de tempo de direção e descanso de motoristas profissionais."
  },
  {
    "id": "ctb-prf-12",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20 do CTB e CF/88",
    "statement": "Compete privativamente à Polícia Federal, com exclusão da PRF, a custódia e apreensão de veículos roubados interceptados durante blitz em rodovias federais.",
    "answer": false,
    "explanation": "ERRADO. A PRF atua no policiamento ostensivo e repressão a crimes em rodovias federais, recuperando veículos roubados e conduzindo-os à polícia judiciária."
  },
  {
    "id": "ctb-prf-13",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, IV do CTB",
    "statement": "A PRF é competente para escoltar veículos de transporte de cargas indivisíveis e superdimensionadas que trafeguem em rodovias e estradas federais.",
    "answer": true,
    "explanation": "CERTO. O Art. 20, IV do CTB expressamente estabelece como atribuição da PRF realizar serviços de escolta aos veículos de cargas superdimensionadas ou indivisíveis."
  },
  {
    "id": "ctb-prf-14",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20 c/c 269 do CTB",
    "statement": "A PRF não tem poder de polícia para reter CNH nem recolher documentos de habilitação vencidos durante fiscalizações de trânsito em rodovias federais.",
    "answer": false,
    "explanation": "ERRADO. Como autoridade executiva e agente de trânsito em rodovias federais, a PRF tem competência para aplicar as medidas administrativas do Art. 269."
  },
  {
    "id": "ctb-prf-15",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, II do CTB",
    "statement": "O patrulhamento ostensivo, executando operações relacionadas com a segurança pública, com o objetivo de preservar a ordem, é competência legal da PRF.",
    "answer": true,
    "explanation": "CERTO. Art. 20, II do CTB: realizar o patrulhamento ostensivo, executando operações relacionadas com a segurança pública, com o objetivo de preservar a ordem."
  },
  {
    "id": "ctb-prf-16",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20 c/c 320 do CTB",
    "statement": "As multas arrecadadas pela PRF em rodovias federais devem ser integralmente repassadas ao Fundo Penitenciário Nacional (FUNPEN).",
    "answer": false,
    "explanation": "ERRADO. Pelo Art. 320 do CTB, a receita das multas é aplicada em sinalização, engenharia de tráfego, policiamento, fiscalização e educação de trânsito, com 5% ao FUNSET."
  },
  {
    "id": "ctb-prf-17",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, III c/c 267 do CTB",
    "statement": "A PRF pode aplicar a penalidade de advertência por escrito nas infrações de natureza leve ou média, desde que cumpridos os requisitos do CTB.",
    "answer": true,
    "explanation": "CERTO. Compete à autoridade da PRF aplicar as penalidades de advertência por escrito e multa previstas no CTB (Art. 20, III c/c Art. 267)."
  },
  {
    "id": "ctb-prf-18",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, VII c/c 34 do CTB",
    "statement": "Compete à PRF processar os recursos contra autuações exclusivamente na JARI Estadual vinculada à capital do Estado em que ocorreu a infração.",
    "answer": false,
    "explanation": "ERRADO. A PRF possui suas próprias JARI da União vinculadas à sua estrutura organizacional para julgar os recursos de suas autuações."
  },
  {
    "id": "ctb-prf-19",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 7º, II e 20 do CTB",
    "statement": "A PRF integra o Sistema Nacional de Trânsito como órgão executivo rodoviário da União na esfera de suas atribuições em rodovias e estradas federais.",
    "answer": true,
    "explanation": "CERTO. Conforme o Art. 7º, II c/c Art. 20 do CTB, a PRF é órgão executivo rodoviário da União que compõe o Sistema Nacional de Trânsito."
  },
  {
    "id": "ctb-prf-20",
    "category": "CTB",
    "topic": "Competências da PRF (Art. 20)",
    "legalBasis": "Art. 20, VIII do CTB",
    "statement": "A fiscalização de excesso de peso e lotação de veículos em rodovias federais concedidas à iniciativa privada é ato privativo e indelegável da concessionária.",
    "answer": false,
    "explanation": "ERRADO. A fiscalização e aplicação de penalidades por excesso de peso em rodovias federais é poder de polícia indelegável da PRF (Art. 20, VIII)."
  },
  {
    "id": "ctb-prf-21",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 302, § 1º, IV do CTB",
    "statement": "No crime de homicídio culposo na direção de veículo automotor, a pena é aumentada se o agente estiver conduzindo veículo de transporte de passageiros.",
    "answer": true,
    "explanation": "CERTO. O Art. 302, § 1º, IV do CTB prevê majorante de um terço à metade se o agente estiver conduzindo veículo de transporte de passageiros no exercício de sua profissão."
  },
  {
    "id": "ctb-prf-22",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 306 do CTB",
    "statement": "A embriaguez ao volante (art. 306 do CTB) exige, para sua consumação, a ocorrência de dano patrimonial ou perigo concreto de colisão devidamente comprovado.",
    "answer": false,
    "explanation": "ERRADO. O crime de embriaguez ao volante é de perigo abstrato, consumando-se com a condução com capacidade psicomotora alterada por álcool."
  },
  {
    "id": "ctb-prf-23",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 305 do CTB",
    "statement": "Comete crime de trânsito quem presta socorro à vítima de sinistro mas deixa de prestar informações necessárias à autoridade policial para eximir-se da culpa.",
    "answer": true,
    "explanation": "CERTO. Art. 305 do CTB: Afastar-se o condutor do veículo do local do sinistro para fugir à responsabilidade penal ou civil que lhe possa ser atribuída."
  },
  {
    "id": "ctb-prf-24",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 293 do CTB",
    "statement": "A penalidade de suspensão do direito de dirigir cominada em sentença penal condenatória não pode ultrapassar o prazo máximo de 1 ano.",
    "answer": false,
    "explanation": "ERRADO. Pelo Art. 293 do CTB, a penalidade penal de suspensão ou proibição de se obter a habilitação tem duração de 2 meses a 5 anos."
  },
  {
    "id": "ctb-prf-25",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 310 do CTB e Súmula 575 STJ",
    "statement": "O crime de confiar ou entregar veículo a pessoa não habilitada ou embriagada (art. 310 do CTB) é de perigo abstrato, conforme súmula vinculante e STJ.",
    "answer": true,
    "explanation": "CERTO. Súmula 575 do STJ: Constitui crime de perigo abstrato a conduta de permitir, confiar ou entregar a direção de veículo automotor a pessoa não habilitada."
  },
  {
    "id": "ctb-prf-26",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 308 c/c 291 do CTB",
    "statement": "Ao crime de racha ou exibição de manobra perigosa (art. 308 do CTB) aplica-se sempre o benefício da composição civil dos danos com extinção da punibilidade.",
    "answer": false,
    "explanation": "ERRADO. O Art. 291, § 1º afasta os institutos despenalizadores da Lei 9.099/95 para o crime de racha / competição não autorizada."
  },
  {
    "id": "ctb-prf-27",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 303, § 2º do CTB",
    "statement": "O condutor que conduzir veículo sob efeito de álcool e provocar lesão corporal culposa grave responde por crime qualificado inafiançável na esfera policial.",
    "answer": true,
    "explanation": "CERTO. Pelo Art. 303, § 2º (Lei 13.546/2017), a pena de reclusão de 2 a 5 anos impede a fixação de fiança pelo delegado de polícia."
  },
  {
    "id": "ctb-prf-28",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 304, parágrafo único do CTB",
    "statement": "A omissão de socorro no trânsito (art. 304 do CTB) deixa de ser punível se a vítima morrer instantaneamente no momento do impacto.",
    "answer": false,
    "explanation": "ERRADO. O parágrafo único do Art. 304 é taxativo: incide no crime mesmo que a omissão seja suprida por terceiros ou que a morte seja instantânea."
  },
  {
    "id": "ctb-prf-29",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 309 do CTB",
    "statement": "Dirigir sem CNH gerando perigo de dano em via pública configura o crime previsto no art. 309 do CTB, de competência do Juizado Especial Criminal.",
    "answer": true,
    "explanation": "CERTO. O Art. 309 exige perigo concreto de dano; com pena de detenção de 6 meses a 1 ano, é infração de menor potencial ofensivo (JECRIM)."
  },
  {
    "id": "ctb-prf-30",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 306 do CTB",
    "statement": "A embriaguez ao volante constatada por etilômetro com valor igual a 0,20 mg/L de ar alveolar caracteriza crime de trânsito previsto no art. 306 do CTB.",
    "answer": false,
    "explanation": "ERRADO. A caracterização de crime pelo etilômetro exige concentração igual ou superior a 0,34 mg/L (valor considerado com margem de erro). 0,20 mg/L é infração administrativa."
  },
  {
    "id": "ctb-prf-31",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 311 do CP e CTB",
    "statement": "A alteração de característica essencial de veículo com fins criminais é punida pelo Código Penal, aplicando-se subsidiariamente as regras do CTB.",
    "answer": true,
    "explanation": "CERTO. Adulterar sinal identificador de veículo automotor é crime tipificado no Art. 311 do Código Penal, interagindo com as sanções do CTB."
  },
  {
    "id": "ctb-prf-32",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 291 do CTB c/c CP",
    "statement": "O perdão judicial no homicídio culposo de trânsito extingue a obrigação administrativa de pagar as multas de trânsito decorrentes da infração cometida.",
    "answer": false,
    "explanation": "ERRADO. As esferas penal e administrativa são independentes. O perdão judicial penal extingue a punibilidade criminal, mantendo as penalidades de trânsito."
  },
  {
    "id": "ctb-prf-33",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 312 do CTB",
    "statement": "Inovar artificiosamente o estado de lugar, de coisa ou de pessoa para induzir a erro perito ou juiz em sinistro de trânsito é crime previsto no art. 312 do CTB.",
    "answer": true,
    "explanation": "CERTO. O Art. 312 do CTB pune a inovação artificiosa em sinistro automobilístico com vítima com detenção de 6 meses a 1 ano ou multa."
  },
  {
    "id": "ctb-prf-34",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 312-B do CTB",
    "statement": "Nos crimes de trânsito culposos, é permitida a aplicação das penas substitutivas de direitos caso o condutor embriagado tenha causado morte de pedestre.",
    "answer": false,
    "explanation": "ERRADO. O Art. 312-B do CTB (Lei 14.071/2020) veda a substituição por pena restritiva de direitos para homicídio ou lesão grave sob efeito de álcool/droga."
  },
  {
    "id": "ctb-prf-35",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 311 do CTB",
    "statement": "Trafegar em velocidade incompatível com a segurança nas proximidades de escolas e hospitais gerando perigo de dano configura crime tipificado no art. 311 do CTB.",
    "answer": true,
    "explanation": "CERTO. O Art. 311 tipifica trafegar em velocidade incompatível gerando perigo de dano junto a escolas, hospitais ou aglomerações."
  },
  {
    "id": "ctb-prf-36",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 291 do CTB",
    "statement": "A ausência de habilitação pelo condutor vítima de colisão gera presunção absoluta de sua culpa penal pelo acidente de trânsito.",
    "answer": false,
    "explanation": "ERRADO. A ausência de habilitação é mera infração administrativa ou crime se gerar perigo concreto de dano, não gerando presunção absoluta de culpa pelo sinistro."
  },
  {
    "id": "ctb-prf-37",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 293 e 296 do CTB",
    "statement": "A condenação transitada em julgado pelo crime de embriaguez ao volante enseja a perda do direito de dirigir e a cassação da habilitação pelo órgão competente.",
    "answer": true,
    "explanation": "CERTO. Conforme o Art. 296 do CTB, transitada em julgado a sentença que impuser suspensão ou proibição de dirigir, a autoridade apreenderá a CNH."
  },
  {
    "id": "ctb-prf-38",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 29 c/c 308 do CTB",
    "statement": "O passageiro que estimula o motorista a participar de racha sem assumir o volante não responde criminalmente, ante a atipicidade da conduta de participação.",
    "answer": false,
    "explanation": "ERRADO. Aplica-se a regra geral do concurso de pessoas (Art. 29 do CP): quem, de qualquer modo, concorre para o crime incide nas penas a este cominadas."
  },
  {
    "id": "ctb-prf-39",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 293 do CTB",
    "statement": "A penalidade de suspensão ou proibição de se obter permissão ou habilitação para dirigir veículo automotor tem duração de 2 meses a 5 anos.",
    "answer": true,
    "explanation": "CERTO. Art. 293 do CTB estabelece expressamente a cominação da penalidade pelo prazo de 2 (dois) meses a 5 (cinco) anos."
  },
  {
    "id": "ctb-prf-40",
    "category": "CTB",
    "topic": "Crimes de Trânsito (Arts. 291 a 312-B)",
    "legalBasis": "Art. 305 do CTB e STF Tema 907",
    "statement": "O crime de fuga do local de sinistro (art. 305 do CTB) foi declarado inconstitucional pelo STF por violação ao princípio da não autoincriminação.",
    "answer": false,
    "explanation": "ERRADO. O STF julgou o Tema 907 de Repercussão Geral e fixou a plena CONSTITUCIONALIDADE do Art. 305 do CTB."
  },
  {
    "id": "ctb-prf-41",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 29, IV do CTB",
    "statement": "Nas vias de pista dupla onde houver duas ou mais faixas no mesmo sentido, as da esquerda são destinadas à ultrapassagem e ao deslocamento dos mais velozes.",
    "answer": true,
    "explanation": "CERTO. Art. 29, IV do CTB: a faixa da esquerda destina-se à ultrapassagem e aos veículos de maior velocidade; as da direita aos mais lentos e de maior porte."
  },
  {
    "id": "ctb-prf-42",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 29, III, b do CTB",
    "statement": "Em rotatórias sem sinalização de preferência, a prioridade de passagem pertence sempre ao condutor do veículo que vier pela direita da via de acesso.",
    "answer": false,
    "explanation": "ERRADO. Pelo Art. 29, III, \"b\" do CTB, no caso de rotatória sem sinalização específica, a preferência de passagem pertence àquele que já estiver circulando por ela."
  },
  {
    "id": "ctb-prf-43",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 29, X do CTB",
    "statement": "O condutor que for ultrapassar outro veículo em rodovia deve indicar previamente a manobra por meio de seta e guardar distância lateral de segurança.",
    "answer": true,
    "explanation": "CERTO. Pelo Art. 29, X, todo condutor deverá indicar com antecedência a manobra pretendida acionando a luz indicadora e guardando distância lateral segura."
  },
  {
    "id": "ctb-prf-44",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 40, V do CTB",
    "statement": "O uso do pisca-alerta é obrigatório e contínuo para qualquer veículo em movimento durante forte neblina ou cerração em rodovias federais.",
    "answer": false,
    "explanation": "ERRADO. O pisca-alerta em movimento só pode ser usado em imobilizações de emergência ou quando a sinalização expressamente determinar (Art. 40, V)."
  },
  {
    "id": "ctb-prf-45",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 29, VIII do CTB",
    "statement": "Os veículos prestadores de serviços de utilidade pública gozam de livre parada e estacionamento no local da prestação de serviço, desde que sinalizados.",
    "answer": true,
    "explanation": "CERTO. Art. 29, VIII: gozam de livre parada e estacionamento no local da prestação de serviço, desde que identificados e na forma estabelecida pelo CONTRAN."
  },
  {
    "id": "ctb-prf-46",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 29, VII, d do CTB",
    "statement": "A prioridade de passagem de viaturas policiais em emergência é absoluta e isenta o motorista da viatura de cautela nas interseções com sinal vermelho.",
    "answer": false,
    "explanation": "ERRADO. Art. 29, VII, \"d\": a prioridade de passagem não é absoluta; exige velocidade reduzida e os devidos cuidados de segurança ao cruzar sinal desfavorável."
  },
  {
    "id": "ctb-prf-47",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 40, I do CTB",
    "statement": "O condutor deve manter acesos os faróis do veículo, utilizando a luz baixa durante a noite em qualquer via e durante o dia em túneis e sob chuva ou neblina.",
    "answer": true,
    "explanation": "CERTO. Art. 40, I do CTB estabelece a obrigatoriedade da luz baixa à noite em qualquer via e durante o dia em túneis, sob chuva, neblina ou cerração."
  },
  {
    "id": "ctb-prf-48",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 40, § 2º do CTB",
    "statement": "Nas rodovias de pista dupla, é obrigatório ligar a luz baixa dos faróis durante o dia sob qualquer condição de tempo e visibilidade para todos os veículos.",
    "answer": false,
    "explanation": "ERRADO. Pela Lei 14.071/2020, em rodovias de pista dupla durante o dia, os faróis baixos NÃO são mais obrigatórios para veículos com luz de condução diurna (DRL)."
  },
  {
    "id": "ctb-prf-49",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 201 do CTB",
    "statement": "Ao ultrapassar um ciclista em via pública, o condutor de veículo automotor deve reduzir a velocidade e guardar a distância lateral mínima de 1,50 metro.",
    "answer": true,
    "explanation": "CERTO. O Art. 201 e Art. 220, XIII do CTB prescrevem guardar a distância lateral de 1,50 metro e reduzir a velocidade compatível ao ultrapassar ciclista."
  },
  {
    "id": "ctb-prf-50",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 49 do CTB",
    "statement": "O embarque e o desembarque de passageiros de automóveis particulares podem ser feitos indistintamente pelo lado da calçada ou da pista de rolamento.",
    "answer": false,
    "explanation": "ERRADO. Art. 49, parágrafo único do CTB: o embarque e desembarque devem ocorrer sempre do lado da calçada, exceto para o condutor."
  },
  {
    "id": "ctb-prf-51",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 68, § 1º do CTB",
    "statement": "O ciclista desmontado empurrando a bicicleta equipara-se ao pedestre em direitos e deveres para fins de circulação no trânsito.",
    "answer": true,
    "explanation": "CERTO. Art. 68, § 1º do CTB: O ciclista desmontado empurrando a bicicleta equipara-se ao pedestre em direitos e deveres."
  },
  {
    "id": "ctb-prf-52",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 193 do CTB",
    "statement": "Nas vias com acostamento pavimentado, é permitido aos veículos automotores trafegar pelo acostamento para efetuar ultrapassagem de veículos lentos.",
    "answer": false,
    "explanation": "ERRADO. Transitar ou ultrapassar pelo acostamento é expressamente proibido e constitui infração gravíssima (Arts. 193 e 202 do CTB)."
  },
  {
    "id": "ctb-prf-53",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 39 c/c 194 do CTB",
    "statement": "A marcha à ré somente é permitida para pequenas manobras e de forma a não causar riscos à segurança do trânsito, sendo vedada em esquinas.",
    "answer": true,
    "explanation": "CERTO. Art. 39 do CTB: a operação de marcha à ré só deve ser executada para pequenas manobras e em esquinas constitui infração grave (Art. 194)."
  },
  {
    "id": "ctb-prf-54",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 219 do CTB",
    "statement": "O condutor que transita em velocidade inferior à metade da máxima permitida na via nunca comete infração, pois a lentidão sempre privilegia a segurança.",
    "answer": false,
    "explanation": "ERRADO. Transitar em velocidade inferior à metade da máxima da via, retardando ou obstruindo o trânsito injustificadamente, é infração média (Art. 219)."
  },
  {
    "id": "ctb-prf-55",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 41 do CTB",
    "statement": "O uso da buzina deve ser feito em toques breves e somente quando estritamente necessário para advertir outros usuários da via ou fora de áreas urbanas.",
    "answer": true,
    "explanation": "CERTO. Art. 41 do CTB: O condutor só poderá buzinar em toque breve para fazer advertências necessárias a fim de evitar sinistros ou fora das áreas urbanas."
  },
  {
    "id": "ctb-prf-56",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 37 do CTB",
    "statement": "Nas rodovias sem acostamento, a conversão à esquerda pode ser feita diretamente sobre a pista de rolamento sem que o condutor aguarde no bordo direito.",
    "answer": false,
    "explanation": "ERRADO. Art. 37: nas vias com acostamento, aguarda-se no acostamento à direita; onde não houver, aguarda-se no centro da pista (ou bordo) com segurança."
  },
  {
    "id": "ctb-prf-57",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 29, II do CTB",
    "statement": "É dever de todo condutor guardar distância de segurança lateral e frontal entre o seu e os demais veículos, bem como em relação à borda da pista.",
    "answer": true,
    "explanation": "CERTO. Art. 29, II do CTB determina expressamente guardar distância de segurança lateral e frontal entre os veículos e em relação ao bordo da pista."
  },
  {
    "id": "ctb-prf-58",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 244, V do CTB",
    "statement": "O transporte de crianças em motocicletas é permitido a partir dos 7 anos de idade, desde que utilizem capacete de segurança de tamanho adequado.",
    "answer": false,
    "explanation": "ERRADO. Pela Lei 14.071/2020 (Art. 244, V do CTB), a idade mínima para transportar criança em motocicleta ou motoneta é de 10 (dez) anos."
  },
  {
    "id": "ctb-prf-59",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 29, § 2º do CTB",
    "statement": "Os veículos de maior porte são sempre responsáveis pela segurança dos menores, os motorizados pelos não motorizados e todos pela proteção dos pedestres.",
    "answer": true,
    "explanation": "CERTO. O Art. 29, § 2º expressa o princípio basilar da hierarquia da segurança viária e proteção ao vulnerável."
  },
  {
    "id": "ctb-prf-60",
    "category": "CTB",
    "topic": "Normas de Circulação e Conduta (Arts. 26 a 67)",
    "legalBasis": "Art. 70 do CTB",
    "statement": "O pedestre tem prioridade absoluta em cruzamentos com semáforo, mesmo que o foco de pedestres esteja vermelho para ele no momento de iniciar a travessia.",
    "answer": false,
    "explanation": "ERRADO. Onde houver sinalização semafórica para pedestres, o pedestre deve respeitar a fase vermelha; a prioridade assegurada é para quem já iniciou a travessia."
  },
  {
    "id": "ctb-prf-61",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 165 do CTB",
    "statement": "Dirigir veículo sob a influência de álcool é infração gravíssima com fator multiplicador por 10 e suspensão do direito de dirigir por 12 meses.",
    "answer": true,
    "explanation": "CERTO. Art. 165 do CTB: infração gravíssima, multa multiplicada por 10 e suspensão do direito de dirigir por 12 (doze) meses."
  },
  {
    "id": "ctb-prf-62",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 165-A do CTB",
    "statement": "A recusa em submeter-se a teste de etilômetro é infração grave com multa simples e sem aplicação da penalidade de suspensão do direito de dirigir.",
    "answer": false,
    "explanation": "ERRADO. Pelo Art. 165-A do CTB, a recusa é infração gravíssima com as MESMAS penalidades do Art. 165 (multa 10x e suspensão por 12 meses)."
  },
  {
    "id": "ctb-prf-63",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 218, III do CTB",
    "statement": "Transitar em velocidade superior à máxima permitida em mais de 50% constitui infração gravíssima punida com multa e suspensão direta da CNH.",
    "answer": true,
    "explanation": "CERTO. Art. 218, III do CTB: velocidade superior à máxima em mais de 50% é infração gravíssima, com multa (3x) e suspensão direta do direito de dirigir."
  },
  {
    "id": "ctb-prf-64",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 256 c/c 269 do CTB",
    "statement": "A medida administrativa de retenção do veículo é penalidade de trânsito aplicada diretamente pelo juiz de direito em audiência de custódia.",
    "answer": false,
    "explanation": "ERRADO. A retenção do veículo é MEDIDA ADMINISTRATIVA de caráter acautelatório aplicada pela autoridade de trânsito e seus agentes (Art. 269), não pelo juiz."
  },
  {
    "id": "ctb-prf-65",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 167 do CTB",
    "statement": "Não usar o cinto de segurança configura infração de trânsito de natureza grave, sujeita à penalidade de multa e retenção do veículo até a colocação.",
    "answer": true,
    "explanation": "CERTO. Art. 167 do CTB: Deixar o condutor ou passageiro de usar o cinto de segurança é infração grave, com multa e retenção do veículo até colocação."
  },
  {
    "id": "ctb-prf-66",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 244, I do CTB",
    "statement": "A condução de motocicleta sem capacete de segurança gera suspensão direta do direito de dirigir e apreensão compulsória e perpétua do veículo.",
    "answer": false,
    "explanation": "ERRADO. A penalidade de apreensão do veículo foi revogada da legislação pela Lei 13.281/2016; a medida cabível é retenção para regularização."
  },
  {
    "id": "ctb-prf-67",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 203, I do CTB",
    "statement": "Ultrapassar pela contramão em curvas ou aclives sem visibilidade suficiente constitui infração gravíssima sujeita à multa multiplicada por 5 vezes.",
    "answer": true,
    "explanation": "CERTO. Art. 203, I do CTB tipifica a ultrapassagem pela contramão em curvas, aclives e declives como infração gravíssima com multa (5x)."
  },
  {
    "id": "ctb-prf-68",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 284, § 1º do CTB",
    "statement": "O pagamento da multa com desconto de 40% pelo SNE independe da renúncia ao direito de interpor recurso contra a autuação de trânsito.",
    "answer": false,
    "explanation": "ERRADO. O Art. 284, § 1º condiciona expressamente o desconto de 40% à adesão ao sistema de notificação eletrônica e à expressa renúncia a recursos."
  },
  {
    "id": "ctb-prf-69",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 267 do CTB",
    "statement": "A advertência por escrito deverá ser imposta à infração leve ou média se o infrator não tiver cometido nenhuma outra infração nos últimos 12 meses.",
    "answer": true,
    "explanation": "CERTO. Pela Lei 14.071/2020 (Art. 267), a aplicação da advertência por escrito passou a ser VINCULADA (deverá ser imposta) se cumpridos os requisitos."
  },
  {
    "id": "ctb-prf-70",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 263 do CTB",
    "statement": "A cassação da CNH não admite que o condutor penalizado requeira sua reabilitação após o cumprimento de qualquer prazo estipulado na lei.",
    "answer": false,
    "explanation": "ERRADO. O Art. 263, § 2º autoriza o condutor cassado a requerer sua reabilitação após decorridos 2 (dois) anos da cassação, submetendo-se a exames."
  },
  {
    "id": "ctb-prf-71",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 230, V do CTB",
    "statement": "Conduzir veículo que não esteja registrado e devidamente licenciado constitui infração gravíssima sujeita à remoção do veículo ao pátio.",
    "answer": true,
    "explanation": "CERTO. Art. 230, V do CTB: conduzir veículo não registrado e não licenciado é infração gravíssima, com multa e remoção do veículo."
  },
  {
    "id": "ctb-prf-72",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 270, § 2º do CTB",
    "statement": "Quando a irregularidade do veículo não puder ser sanada no local da fiscalização, a retenção nunca pode ser liberada mediante termo de compromisso.",
    "answer": false,
    "explanation": "ERRADO. O Art. 270, § 2º autoriza a liberação mediante recolhimento do CRLV ou bloqueio eletrônico, concedendo prazo de até 30 dias se houver segurança."
  },
  {
    "id": "ctb-prf-73",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 176, I do CTB",
    "statement": "Deixar o condutor envolvido em sinistro com vítima de adotar providências para socorrer a vítima é infração gravíssima (multa 5x) e suspensão da CNH.",
    "answer": true,
    "explanation": "CERTO. Art. 176, I do CTB: Deixar de prestar ou providenciar socorro à vítima é infração gravíssima, com multa (5x) e suspensão do direito de dirigir."
  },
  {
    "id": "ctb-prf-74",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 257, § 7º do CTB",
    "statement": "O proprietário do veículo tem prazo improrrogável de 15 dias corridos para indicar o condutor infrator nos casos de infração em movimento.",
    "answer": false,
    "explanation": "ERRADO. Pela Lei 14.071/2020 (Art. 257, § 7º), o prazo para o principal condutor ou proprietário indicar o real infrator é de 30 (trinta) dias."
  },
  {
    "id": "ctb-prf-75",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 261, § 5º do CTB",
    "statement": "A suspensão do direito de dirigir por pontuação ocorre com 40 pontos para condutor que exerce atividade remunerada, independentemente da gravidade.",
    "answer": true,
    "explanation": "CERTO. Art. 261, § 5º: Para condutor que exerce atividade remunerada (EAR), a suspensão por pontos ocorre somente aos 40 pontos, independente das infrações."
  },
  {
    "id": "ctb-prf-76",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 261, I do CTB",
    "statement": "Se o condutor acumular duas infrações gravíssimas em 12 meses, o limite de pontos para instauração da suspensão do direito de dirigir permanece em 40 pontos.",
    "answer": false,
    "explanation": "ERRADO. Art. 261, I, \"c\": caso constem 2 ou mais infrações gravíssimas na pontuação em 12 meses, o limite é reduzido para 20 (vinte) pontos."
  },
  {
    "id": "ctb-prf-77",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 252, IV do CTB",
    "statement": "O uso de calçado que não se firme nos pés ou que comprometa a utilização dos pedais ao dirigir configura infração de natureza média com multa.",
    "answer": true,
    "explanation": "CERTO. Art. 252, IV do CTB: Dirigir o veículo usando calçado que não se firme nos pés ou comprometa o uso dos pedais é infração média."
  },
  {
    "id": "ctb-prf-78",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 165-A c/c 277 do CTB",
    "statement": "A realização de teste em etilômetro é compulsória sob pena de prisão em flagrante delito automática pelo crime de desacato à autoridade pública.",
    "answer": false,
    "explanation": "ERRADO. Ninguém é obrigado a produzir prova contra si mesmo (nemo tenetur se detegere). A recusa gera sanção administrativa do Art. 165-A, não prisão."
  },
  {
    "id": "ctb-prf-79",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 231, VII do CTB",
    "statement": "Transitar com veículo com lotação excedente constitui infração de trânsito de natureza média, com penalidade de multa e retenção do veículo.",
    "answer": true,
    "explanation": "CERTO. Art. 231, VII do CTB: Transitar com lotação excedente é infração média, com penalidade de multa e medida administrativa de retenção do veículo."
  },
  {
    "id": "ctb-prf-80",
    "category": "CTB",
    "topic": "Infrações e Medidas Administrativas (Arts. 161 a 279-A)",
    "legalBasis": "Art. 148, § 3º do CTB",
    "statement": "A pontuação de infrações cometidas durante o período da Permissão para Dirigir (PPD) prescreve a cada 6 meses ininterruptos sem penalidade.",
    "answer": false,
    "explanation": "ERRADO. A PPD dura 1 ano (12 meses). O cometimento de infração grave, gravíssima ou reincidência em média impede a concessão da CNH definitiva."
  },
  {
    "id": "ctb-prf-81",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 143, III c/c 145 do CTB",
    "statement": "Para habilitar-se na categoria C, o condutor deve estar habilitado há no mínimo 1 ano na categoria B e não ter cometido mais de uma infração gravíssima nos últimos 12 meses.",
    "answer": true,
    "explanation": "CERTO. Art. 143 c/c Art. 145 do CTB com redação da Lei 14.440/2022: exige 1 ano na categoria B e não ter mais de uma infração gravíssima em 12 meses."
  },
  {
    "id": "ctb-prf-82",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 145, I do CTB",
    "statement": "O candidato à obtenção da CNH na categoria D pode ter 18 anos de idade completos, desde que possua 2 anos de categoria B e comprove aprovação em curso de direção defensiva.",
    "answer": false,
    "explanation": "ERRADO. Para habilitar-se nas categorias D e E é requisito etário OBRIGATÓRIO ter idade mínima de 21 (vinte e um) anos completos (Art. 145, I)."
  },
  {
    "id": "ctb-prf-83",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 147, § 2º do CTB",
    "statement": "A renovação do exame de aptidão física e mental para condutores com menos de 50 anos de idade é de 10 anos, conforme atualização da Lei nº 14.071/2020.",
    "answer": true,
    "explanation": "CERTO. Art. 147, § 2º, I do CTB: a renovação do exame de aptidão física e mental é a cada 10 anos para condutores com idade inferior a 50 anos."
  },
  {
    "id": "ctb-prf-84",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 147, § 2º, III do CTB",
    "statement": "Para condutores com idade igual ou superior a 70 anos, o prazo máximo ordinário de validade do exame de aptidão física e mental é de 5 anos ininterruptos.",
    "answer": false,
    "explanation": "ERRADO. Conforme o Art. 147, § 2º, III, para condutores com idade igual ou superior a 70 anos, o exame de aptidão física e mental é renovado a cada 3 (três) anos."
  },
  {
    "id": "ctb-prf-85",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 148-A, § 2º do CTB",
    "statement": "Os condutores das categorias C, D e E com idade inferior a 70 anos devem realizar exame toxicológico periódico com periodicidade sucessiva de 2 anos e 6 meses.",
    "answer": true,
    "explanation": "CERTO. Art. 148-A, § 2º: É obrigatório o exame toxicológico intermediário a cada 2 anos e 6 meses para motoristas C, D e E com menos de 70 anos."
  },
  {
    "id": "ctb-prf-86",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 165-D do CTB",
    "statement": "A não realização do exame toxicológico periódico após 30 dias do vencimento constitui infração de natureza grave e não prevê penalidade de suspensão da CNH.",
    "answer": false,
    "explanation": "ERRADO. Art. 165-D: Não realizar o toxicológico intermediário é infração GRAVÍSSIMA, com multa (5x) e, em caso de reincidência em 12 meses, suspensão da CNH."
  },
  {
    "id": "ctb-prf-87",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 159, § 1º-A do CTB",
    "statement": "A Carteira Nacional de Habilitação eletrônica (CNH-e) possui a mesma validade jurídica do documento físico impresso em todo o território nacional.",
    "answer": true,
    "explanation": "CERTO. Art. 159, § 1º-A do CTB expressamente estabelece que a CNH em meio eletrônico possui o mesmo valor legal e probatório do documento impresso."
  },
  {
    "id": "ctb-prf-88",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 159, § 1º-A do CTB",
    "statement": "O porte do documento de habilitação físico é obrigatório em qualquer circunstância, sendo vedada a consulta direta ao sistema informatizado da PRF.",
    "answer": false,
    "explanation": "ERRADO. O porte do documento de habilitação será dispensado quando, no momento da fiscalização, for possível ter acesso ao sistema informatizado (Art. 159)."
  },
  {
    "id": "ctb-prf-89",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 148, § 3º do CTB",
    "statement": "Ao final de um ano da Permissão para Dirigir (PPD), o condutor obterá a CNH definitiva desde que não tenha cometido infração grave ou gravíssima, nem seja reincidente em média.",
    "answer": true,
    "explanation": "CERTO. Art. 148, § 3º: A CNH definitiva será conferida desde que o condutor não tenha cometido nenhuma infração grave ou gravíssima ou seja reincidente em média."
  },
  {
    "id": "ctb-prf-90",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 148, § 3º do CTB",
    "statement": "O cometimento de uma única infração de natureza média durante o período da Permissão para Dirigir impede a expedição da CNH definitiva do condutor.",
    "answer": false,
    "explanation": "ERRADO. O CTB veda a concessão da CNH definitiva apenas se o permissionário for REINCIDENTE em infração média (ou cometer uma grave ou gravíssima)."
  },
  {
    "id": "ctb-prf-91",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 281, parágrafo único, II do CTB",
    "statement": "A notificação da autuação expedida após o prazo máximo de 30 dias do cometimento da infração enseja a decadência do direito de punir e o arquivamento do auto.",
    "answer": true,
    "explanation": "CERTO. Art. 281, parágrafo único, II: O auto de infração será arquivado e seu registro julgado insubsistente se, no prazo máximo de 30 dias, não for expedida a notificação."
  },
  {
    "id": "ctb-prf-92",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 288 do CTB",
    "statement": "Da decisão da JARI que mantiver a penalidade aplicada pela PRF não cabe mais nenhum recurso na via administrativa, encerrando-se a instância recursal.",
    "answer": false,
    "explanation": "ERRADO. Das decisões da JARI cabe recurso em segunda e última instância administrativa ao Colegiado Especial da PRF / CONTRAN conforme Art. 288."
  },
  {
    "id": "ctb-prf-93",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 285 do CTB",
    "statement": "O recurso contra a penalidade de trânsito interposto tempestivamente perante a JARI terá efeito suspensivo por determinação expressa do CTB.",
    "answer": true,
    "explanation": "CERTO. Pela Lei 14.229/2021 (Art. 285 do CTB), o recurso tempestivo contra a penalidade tem efeito suspensivo automático até o julgamento."
  },
  {
    "id": "ctb-prf-94",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 280, VI do CTB",
    "statement": "O auto de infração de trânsito lavrado pela PRF só é válido se constar a assinatura física obrigatória do condutor flagrado na rodovia federal.",
    "answer": false,
    "explanation": "ERRADO. Art. 280, VI do CTB: a assinatura do infrator é coletada sempre que possível, valendo esta como notificação, mas sua recusa não invalida o auto."
  },
  {
    "id": "ctb-prf-95",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 268, II do CTB",
    "statement": "A imposição da penalidade de suspensão do direito de dirigir decorrente de processo administrativo exige a realização de curso de reciclagem e exame.",
    "answer": true,
    "explanation": "CERTO. Art. 268, II do CTB: O infrator será submetido a curso de reciclagem sempre que for suspenso do direito de dirigir."
  },
  {
    "id": "ctb-prf-96",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 261 do CTB",
    "statement": "A pontuação de infrações de trânsito permanece ativa no prontuário do condutor pelo período improrrogável de 36 meses para efeito de reincidência.",
    "answer": false,
    "explanation": "ERRADO. Conforme o Art. 261 do CTB, a contagem de pontos no prontuário do condutor computa infrações cometidas no período de 12 (doze) meses."
  },
  {
    "id": "ctb-prf-97",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 143, II do CTB",
    "statement": "O condutor habilitado na categoria B pode conduzir veículo motorizado cujo peso bruto total não exceda a 3.500 kg e cuja lotação não exceda a 8 lugares.",
    "answer": true,
    "explanation": "CERTO. Art. 143, II do CTB: categoria B abrange veículos com PBT de até 3.500 kg e lotação que não exceda a 8 lugares, excluído o do motorista."
  },
  {
    "id": "ctb-prf-98",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 144, parágrafo único do CTB",
    "statement": "Para dirigir trator de rodas e máquinas agrícolas em via pública é indispensável possuir habilitação profissional de categoria D ou E.",
    "answer": false,
    "explanation": "ERRADO. Art. 144, parágrafo único do CTB: o trator de roda e os aparelhos automotores destinados a puxar ou a arrastar maquinaria podem ser conduzidos com CNH B."
  },
  {
    "id": "ctb-prf-99",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 263, § 2º do CTB",
    "statement": "O condutor penalizado com cassação da CNH poderá requerer sua reabilitação após decorridos 2 anos do efetivo cumprimento da penalidade.",
    "answer": true,
    "explanation": "CERTO. Art. 263, § 2º: Decorridos dois anos da cassação da CNH, o infrator poderá requerer sua reabilitação, submetendo-se a todos os exames."
  },
  {
    "id": "ctb-prf-100",
    "category": "CTB",
    "topic": "Habilitação e Processo Administrativo (Arts. 140 a 160)",
    "legalBasis": "Art. 284, § 2º do CTB",
    "statement": "O pagamento antecipado do valor da multa de trânsito impede e inviabiliza terminantemente a interposição de recurso administrativo contra o auto.",
    "answer": false,
    "explanation": "ERRADO. Art. 284, § 2º: O pagamento da multa não impede a interposição de recurso; se julgado procedente, a importância paga será devolvida corrigida."
  },
  {
    "id": "contran-prf-01",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021, Art. 3º",
    "statement": "Conforme a Resolução CONTRAN nº 882/2021, a largura máxima permitida para veículos que trafegam em vias públicas, ressalvadas exceções legais, é de 2,60 metros.",
    "answer": true,
    "explanation": "CERTO. Art. 3º, I da Res. 882/2021 estabelece a largura máxima regulamentar de 2,60 metros (ou 2,70 m para veículos com caçamba frigorífica isotérmica)."
  },
  {
    "id": "contran-prf-02",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021, Art. 3º",
    "statement": "A altura máxima regulamentar admitida para veículos de transporte de carga pelo CONTRAN é de 5,50 metros para qualquer tipo de carroceria padrão.",
    "answer": false,
    "explanation": "ERRADO. Conforme a Resolução 882/2021, a altura máxima permitida é de 4,40 metros; dimensões superiores exigem Autorização Especial de Trânsito (AET)."
  },
  {
    "id": "contran-prf-03",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021, Art. 19",
    "statement": "Segundo a Resolução CONTRAN nº 882/2021, a tolerância de pesagem por balança rodoviária dinâmica é de 5% sobre o PBT e de 12,5% sobre o peso por eixo isolado.",
    "answer": true,
    "explanation": "CERTO. Pela Lei 14.229/2021 e Res. 882/2021, a tolerância metrológica de pesagem é de 5% sobre o PBT e 12,5% sobre o peso transmitido por eixo."
  },
  {
    "id": "contran-prf-04",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 945/2022",
    "statement": "O transporte de toras de madeira em toras brutas independe de cabos de aço ou cintas têxteis caso as toras estejam encaixadas nos fueiros do caminhão.",
    "answer": false,
    "explanation": "ERRADO. A Resolução 945/2022 torna obrigatória a amarração com cabos de aço, correntes ou cintas têxteis com capacidade de carga dimensionada por camada de toras."
  },
  {
    "id": "contran-prf-05",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 946/2022, Art. 4º",
    "statement": "Na amarração de cargas, é expressamente vedada a utilização de cordas como dispositivo primário de amarração, admitindo-se seu uso para fixação de lonas.",
    "answer": true,
    "explanation": "CERTO. A Resolução 946/2022 veda cordas para fixação direta da carga, autorizando-as unicamente para amarrar lona de proteção superficial."
  },
  {
    "id": "contran-prf-06",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 946/2022",
    "statement": "É permitido afixar dispositivos de amarração de carga diretamente no piso de madeira compensada da carroceria sem ancoragem em travessas metálicas do chassi.",
    "answer": false,
    "explanation": "ERRADO. Os pontos de amarração devem ser ancorados diretamente em elementos estruturais metálicos do chassi ou das travessas da carroceria."
  },
  {
    "id": "contran-prf-07",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021",
    "statement": "A Autorização Especial de Trânsito (AET) é obrigatória para Combinações de Veículos de Carga (CVC) com comprimento superior a 19,80 metros.",
    "answer": true,
    "explanation": "CERTO. As CVCs (ex: bitrem, rodotrem) com comprimento acima de 19,80 m ou PBT superior a 57 toneladas exigem AET emitida pelo órgão com circunscrição sobre a via."
  },
  {
    "id": "contran-prf-08",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021, Art. 3º",
    "statement": "O limite de comprimento máximo para veículos articulados com duas unidades (cavalo e semirreboque) sem AET é de 25,00 metros em rodovias federais.",
    "answer": false,
    "explanation": "ERRADO. Para veículos articulados com 2 unidades, o comprimento máximo regulamentar sem AET é de 18,60 metros (ou 19,80 m para transporte de veículos tipo cegonha)."
  },
  {
    "id": "contran-prf-09",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021",
    "statement": "Conforme a Resolução 882/2021, veículos com excesso de peso no PBT ou nos eixos estão sujeitos a transbordo ou remanejamento de carga para liberação.",
    "answer": true,
    "explanation": "CERTO. Havendo excesso de peso acima da tolerância regulamentar, a retenção do veículo exige o remanejamento ou transbordo da carga para desinterdição."
  },
  {
    "id": "contran-prf-10",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021",
    "statement": "A fiscalização de peso por nota fiscal independe de pesagem em balança rodoviária, podendo gerar autuação direta mesmo que o PBT aferido esteja dentro da margem.",
    "answer": false,
    "explanation": "ERRADO. A fiscalização por documento fiscal só se aplica onde não houver balança ou quando a pesagem física for inviável, observadas as tolerâncias legais."
  },
  {
    "id": "contran-prf-11",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 945/2022",
    "statement": "No transporte de blocos de rochas ornamentais (granito/mármore), é obrigatório o uso de travas de contenção lateral e cintas de alta tenacidade ou correntes.",
    "answer": true,
    "explanation": "CERTO. A Resolução 945/2022 estabelece requisitos rígidos para blocos de rochas ornamentais, exigindo berços de apoio, travas e correntes/cintas especiais."
  },
  {
    "id": "contran-prf-12",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 859/2021",
    "statement": "Caminhões basculantes em trânsito não necessitam de dispositivo de segurança primário e secundário que impeça o acionamento involuntário da caçamba.",
    "answer": false,
    "explanation": "ERRADO. O CONTRAN exige dispositivo de segurança duplo (primário e secundário) que impeça o acionamento e levantamento acidental da caçamba basculante em trânsito."
  },
  {
    "id": "contran-prf-13",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 946/2022",
    "statement": "A amarração de cargas indivisíveis deve garantir a fixação contra deslocamentos longitudinais para frente e para trás, além de movimentações transversais.",
    "answer": true,
    "explanation": "CERTO. A Resolução 946/2022 exige que o sistema de amarração suporte forças de inércia para frente (0,8g), para trás (0,5g) e laterais (0,5g)."
  },
  {
    "id": "contran-prf-14",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 946/2022",
    "statement": "A cinta têxtil de amarração de carga que apresentar fios cortados ou desgaste excessivo pode ser utilizada desde que receba reforço de nós manuais.",
    "answer": false,
    "explanation": "ERRADO. É proibido usar cintas têxteis com emendas, nós ou cortes; o dispositivo avariado perde a certificação e deve ser prontamente descartado."
  },
  {
    "id": "contran-prf-15",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021, Art. 3º",
    "statement": "O comprimento total de um caminhão simples (monobloco ou chassi rígido) não pode exceder o limite legal de 14,00 metros estabelecido pelo CONTRAN.",
    "answer": true,
    "explanation": "CERTO. Art. 3º, II da Resolução 882/2021: o comprimento máximo para veículo não articulado (caminhão simples) é de 14,00 metros."
  },
  {
    "id": "contran-prf-16",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021",
    "statement": "A prorrogação de prazo de AET concedida para transporte de carga superdimensionada pode ser estendida tacitamente sem nova manifestação do órgão rodoviário.",
    "answer": false,
    "explanation": "ERRADO. A AET tem prazo de validade determinado e itinerário estrito; não existe prorrogação tácita de autorização especial de trânsito."
  },
  {
    "id": "contran-prf-17",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021",
    "statement": "Veículos de carga equipados com suspensão pneumática ou mola devem manter os dispositivos de controle de altura em perfeitas condições operacionais.",
    "answer": true,
    "explanation": "CERTO. Os sistemas de suspensão e mecanismos de elevação de eixo devem obedecer às diretrizes do fabricante e regulamentos técnicos do CONTRAN."
  },
  {
    "id": "contran-prf-18",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021",
    "statement": "A carga transportada pode ultrapassar a largura do veículo em até 50 centímetros de cada lado sem qualquer sinalização de advertência em rodovias federais.",
    "answer": false,
    "explanation": "ERRADO. A carga não pode ultrapassar a largura da carroceria sem AET específica e sinalização de advertência obrigatória (placas refletivas/escolta)."
  },
  {
    "id": "contran-prf-19",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021",
    "statement": "O peso bruto total homologado pelo fabricante deve estar identificado na plaqueta de identificação de tara e lotação afixada no veículo de carga.",
    "answer": true,
    "explanation": "CERTO. É obrigatória a inscrição do PBT, tara e lotação em plaqueta inviolável afixada no veículo para conferência da fiscalização rodoviária."
  },
  {
    "id": "contran-prf-20",
    "category": "CONTRAN",
    "topic": "Cargas, Pesos e Amarração (Res. 882, 945, 946)",
    "legalBasis": "Resolução CONTRAN nº 882/2021",
    "statement": "Em fiscalização de peso de carga viva perecível, não se admite a tolerância técnica regulamentar de pesagem aplicada às demais cargas secas.",
    "answer": false,
    "explanation": "ERRADO. As tolerâncias legais metrológicas (5% sobre PBT e 12,5% por eixo) aplicam-se a todas as modalidades de transporte por balança."
  },
  {
    "id": "contran-prf-21",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 1027/2025, Art. 5º",
    "statement": "Nos termos da Resolução CONTRAN nº 1027/2025, o registro inicial de veículo novo adquirido em concessionária utiliza a interoperabilidade com o sistema Renave.",
    "answer": true,
    "explanation": "CERTO. Art. 5º da Res. 1027/2025: O primeiro registro do veículo novo observa a interoperabilidade com a saída de estoque no sistema Renave."
  },
  {
    "id": "contran-prf-22",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 1027/2025",
    "statement": "O Certificado de Registro e Licenciamento de Veículo digital (CRLV-e) impresso em papel A4 comum perde totalmente seu valor jurídico perante a fiscalização da PRF.",
    "answer": false,
    "explanation": "ERRADO. O CRLV-e impresso em papel A4 comum com o QR Code de segurança possui plena validade jurídica e deve ser aceito na fiscalização de trânsito."
  },
  {
    "id": "contran-prf-23",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 1027/2025",
    "statement": "A validação da autenticidade do CRLV-e em fiscalização de trânsito é realizada mediante a leitura do código bidimensional QR Code padrão Vio.",
    "answer": true,
    "explanation": "CERTO. O QR Code impresso no documento permite a conferência imediata de sua autenticidade no aplicativo oficial Vio desenvolvido pelo Serpro/Senatran."
  },
  {
    "id": "contran-prf-24",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Art. 134 do CTB e Resolução 1027",
    "statement": "O proprietário que transferir a propriedade de veículo automotor não tem obrigação de comunicar a venda ao órgão de trânsito se o comprador firmar recibo particular.",
    "answer": false,
    "explanation": "ERRADO. A comunicação de venda é obrigação legal (Art. 134 do CTB); na omissão, o antigo proprietário responde solidariamente pelas penalidades impostas."
  },
  {
    "id": "contran-prf-25",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 969/2022",
    "statement": "As Placas de Identificação Veicular (PIV) no padrão Mercosul contêm código QR Code individual para controle de estampagem e rastreamento oficial.",
    "answer": true,
    "explanation": "CERTO. Conforme a Resolução 969/2022, a PIV possui QR Code com número de série exclusivo para rastreamento da estamparia e combate a clonagens."
  },
  {
    "id": "contran-prf-26",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 969/2022",
    "statement": "No padrão PIV Mercosul, a cor dos caracteres alfanuméricos é idêntica para todas as categorias de veículos, inclusive comerciais e de coleção.",
    "answer": false,
    "explanation": "ERRADO. A cor dos caracteres varia por categoria: preto (particular), vermelho (comercial), azul (oficial), cinza (coleção), verde (experiência)."
  },
  {
    "id": "contran-prf-27",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 969/2022",
    "statement": "A substituição da placa cinza antiga pelo padrão Mercosul é obrigatória nos casos de transferência de município ou Estado de registro do veículo.",
    "answer": true,
    "explanation": "CERTO. A Resolução 969/2022 exige adoção da PIV Mercosul em caso de transferência de domicílio do veículo, primeiro emplacamento, roubo ou dano da placa."
  },
  {
    "id": "contran-prf-28",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 969/2022",
    "statement": "A colocação de películas refletivas ou adesivos sobre os caracteres da placa Mercosul é autorizada pelo CONTRAN desde que preserve o QR Code legível.",
    "answer": false,
    "explanation": "ERRADO. É expressamente proibida a aposição de qualquer película, adorno ou elemento que interfira na visualização ou reflexão da placa."
  },
  {
    "id": "contran-prf-29",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 969/2022",
    "statement": "A placa dianteira é dispensada exclusivamente para motocicletas, motonetas, ciclomotores, triciclos e reboques, que portam apenas a placa traseira.",
    "answer": true,
    "explanation": "CERTO. Conforme o Art. 115 do CTB e Resolução 969/2022, veículos de 2 ou 3 rodas e reboques utilizam unicamente a placa traseira."
  },
  {
    "id": "contran-prf-30",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 1027/2025",
    "statement": "O comprovante de quitação do IPVA substitui integralmente a emissão do CRLV-e para fins de fiscalização do licenciamento anual pela PRF.",
    "answer": false,
    "explanation": "ERRADO. O pagamento do IPVA não equivale a licenciamento; o veículo só está licenciado após a emissão do CRLV-e com todos os encargos quitados."
  },
  {
    "id": "contran-prf-31",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 1027/2025",
    "statement": "O sistema Renave viabiliza a escrituração eletrônica de entrada e saída de veículos do estoque de estabelecimentos comerciais revendedores.",
    "answer": true,
    "explanation": "CERTO. O Renave integra os estoques de concessionárias e garagens ao Renavan, dispensando reconhecimento físico de firma para transferência de estoque."
  },
  {
    "id": "contran-prf-32",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 1027/2025",
    "statement": "A baixa definitiva de veículo irrecuperável ou sinistrado com perda total pode ser solicitada mesmo sem o recolhimento das placas e recorte do chassi.",
    "answer": false,
    "explanation": "ERRADO. A baixa definitiva exige obrigatoriamente a entrega das placas e a comprovação da destruição ou recorte do sinal identificador do chassi."
  },
  {
    "id": "contran-prf-33",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN 1027 c/c 292 CTB",
    "statement": "A autorização para alteração de características de veículo (como suspensão ou combustível) depende de prévia anuência da autoridade de trânsito e CSV.",
    "answer": true,
    "explanation": "CERTO. Art. 98 do CTB e resoluções do CONTRAN exigem autorização prévia do órgão executivo de trânsito e Certificado de Segurança Veicular (CSV)."
  },
  {
    "id": "contran-prf-34",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 1027/2025",
    "statement": "O veículo de fabricação artesanal pode ser licenciado e emplacado independentemente de aprovação em inspeção técnica veicular ou obtenção de CAT.",
    "answer": false,
    "explanation": "ERRADO. Veículos artesanais demandam Certificado de Adequação à Legislação de Trânsito (CAT) e CSV emitido por Instituição Técnica Licenciada (ITL)."
  },
  {
    "id": "contran-prf-35",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 968/2022",
    "statement": "A gravação do número do chassi (VIN) deve constar em pelo menos um ponto estrutural do veículo e nas etiquetas e vidros conforme as normas vigentes.",
    "answer": true,
    "explanation": "CERTO. Resolução 968/2022 determina a gravação primária do VIN na estrutura e regravações secundárias em etiquetas destrutíveis e nos vidros."
  },
  {
    "id": "contran-prf-36",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 968/2022",
    "statement": "A remarcação de número de chassi pode ser realizada livremente por oficina mecânica credenciada sem necessidade de autorização prévia do DETRAN.",
    "answer": false,
    "explanation": "ERRADO. A remarcação de chassi depende impreterivelmente de prévia autorização e vistoria do DETRAN, mediante processo de regravação oficial."
  },
  {
    "id": "contran-prf-37",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN 1027 c/c 131 CTB",
    "statement": "A expedição de novo CRLV-e exige a quitação prévia e integral de todos os tributos, encargos e multas de trânsito vinculados ao prontuário do veículo.",
    "answer": true,
    "explanation": "CERTO. Art. 131, § 2º do CTB: o veículo somente será considerado licenciado após a quitação dos débitos relativos a tributos, encargos e multas vinculadas."
  },
  {
    "id": "contran-prf-38",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 969/2022",
    "statement": "Em caso de extravio da placa traseira de veículo em rodovia, o condutor pode confeccionar placa provisória artesanal para circular até seu destino.",
    "answer": false,
    "explanation": "ERRADO. Circular sem placa de identificação constitui infração gravíssima (Art. 230, IV); é vedada placa provisória artesanal."
  },
  {
    "id": "contran-prf-39",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 969/2022",
    "statement": "Para veículos de coleção, a placa Mercosul possui fundo branco com caracteres na cor preta, atendendo aos critérios de originalidade regulamentares.",
    "answer": true,
    "explanation": "CERTO. A Resolução 969/2022 (com alteração pela Res. 984) estabeleceu que veículos de coleção usam caracteres pretos sobre fundo cinza/estampado próprio."
  },
  {
    "id": "contran-prf-40",
    "category": "CONTRAN",
    "topic": "Registro e Licenciamento (Res. 1027, 968, 969)",
    "legalBasis": "Resolução CONTRAN nº 1027/2025",
    "statement": "A consulta online do CRLV-e pela autoridade fiscalizadora supre a infração caso o veículo esteja com o licenciamento anual atrasado no sistema.",
    "answer": false,
    "explanation": "ERRADO. A consulta ao sistema verifica se o veículo ESTÁ licenciado; caso conste débito e atraso no sistema, o veículo será autuado e removido."
  },
  {
    "id": "contran-prf-41",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025, Art. 4º",
    "statement": "Conforme a Resolução CONTRAN nº 1031/2025, o etilômetro utilizado na fiscalização de trânsito deve ser aprovado pelo Inmetro e verificado anualmente.",
    "answer": true,
    "explanation": "CERTO. O etilômetro deve ter seu modelo aprovado pelo Inmetro e passar por verificação metrológica periódica anual (ou calibração oficial)."
  },
  {
    "id": "contran-prf-42",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "A constatação de alcoolemia pela PRF só pode ser realizada mediante exame de sangue, sendo o etilômetro expressamente proibido como prova de infração.",
    "answer": false,
    "explanation": "ERRADO. O teste de ar alveolar (etilômetro) é o principal meio ordinário utilizado na fiscalização de trânsito, gozando de fé pública."
  },
  {
    "id": "contran-prf-43",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025, Anexo I",
    "statement": "A medição realizada no etilômetro sofre desconto do erro máximo admissível (tabela de valor considerado) para determinação da infração e do crime.",
    "answer": true,
    "explanation": "CERTO. O valor medido sofre dedução da margem de erro metrológica, obtendo-se o valor considerado que fundamenta a sanção administrativa e penal."
  },
  {
    "id": "contran-prf-44",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN 1031/2025 c/c 306 CTB",
    "statement": "O valor considerado no etilômetro igual ou superior a 0,30 mg/L de ar alveolar configura unicamente infração de trânsito, sem repercussão criminal.",
    "answer": false,
    "explanation": "ERRADO. Medição com valor considerado igual ou superior a 0,34 mg/L de ar alveolar caracteriza o CRIME de trânsito previsto no Art. 306 do CTB."
  },
  {
    "id": "contran-prf-45",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "A recusa do condutor em realizar o teste do etilômetro enseja a lavratura de auto de infração pelo art. 165-A do CTB e recolhimento da habilitação.",
    "answer": true,
    "explanation": "CERTO. A recusa aos testes de alcoolemia atrai as sanções do Art. 165-A do CTB e medidas administrativas cabíveis (recolhimento da CNH e retenção)."
  },
  {
    "id": "contran-prf-46",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "Se o condutor se recusar ao etilômetro, a PRF deve obrigatoriamente conduzi-lo à força para coleta compulsória de sangue em unidade de saúde.",
    "answer": false,
    "explanation": "ERRADO. É vedada a condução coativa para coleta forçada de sangue. A recusa é sancionada administrativamente pelo Art. 165-A."
  },
  {
    "id": "contran-prf-47",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025, Art. 5º",
    "statement": "Os sinais de alteração da capacidade psicomotora podem ser descritos pelo policial rodoviário federal em Termo de Constatação de Sinais ou vídeo.",
    "answer": true,
    "explanation": "CERTO. Art. 5º da Res. 1031: a alteração psicomotora pode ser demonstrada por exame clínico, Termo de Constatação de Sinais ou prova testemunhal/vídeo."
  },
  {
    "id": "contran-prf-48",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025, Art. 5º",
    "statement": "A constatação da embriaguez por sinais visíveis exige a presença cumulativa e obrigatória de pelo menos 15 sintomas listados na resolução.",
    "answer": false,
    "explanation": "ERRADO. O agente de trânsito deve certificar conjunto de sinais (em geral 2 ou mais sinais característicos de sonolência, odor, desorientação, etc.)."
  },
  {
    "id": "contran-prf-49",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "O condutor autuado por embriaguez terá seu veículo retido até a apresentação de condutor habilitado que realize o teste e comprove estar sóbrio.",
    "answer": true,
    "explanation": "CERTO. A liberação do veículo retido exige a apresentação de outro condutor habilitado que se submeta ao etilômetro com resultado zero."
  },
  {
    "id": "contran-prf-50",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "A apresentação de condutor habilitado que também se recuse a realizar o teste do etilômetro autoriza a imediata liberação do veículo retido.",
    "answer": false,
    "explanation": "ERRADO. O condutor apresentado deve necessariamente submeter-se ao teste e ter sua higidez física atestada; caso recuse, o veículo não é liberado a ele."
  },
  {
    "id": "contran-prf-51",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "Na hipótese de sinistro de trânsito com vítima, a autoridade policial deve submeter os condutores envolvidos a teste para detecção de álcool.",
    "answer": true,
    "explanation": "CERTO. É procedimento prioritário e regulamentar em sinistros graves submeter condutores envolvidos ao teste de etilômetro ou avaliação clínica."
  },
  {
    "id": "contran-prf-52",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "O etilômetro passivo (que detecta presença de álcool à distância) serve por si só para a lavratura direta do auto de infração de trânsito.",
    "answer": false,
    "explanation": "ERRADO. O etilômetro passivo é apenas instrumento de triagem; a confirmação para lavratura de auto exige o teste no etilômetro ativo homologado."
  },
  {
    "id": "contran-prf-53",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "O teste de ar alveolar com resultado positivo no etilômetro passivo impõe a realização do teste com bocal descartável no etilômetro ativo.",
    "answer": true,
    "explanation": "CERTO. Detectada a presença de álcool no teste de triagem passiva, o condutor é convidado a realizar o teste quantitativo no etilômetro ativo com bocal lacrado."
  },
  {
    "id": "contran-prf-54",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "O consumo comprovado de bombom de licor ou enxaguante bucal afasta permanentemente a infração do art. 165, mesmo se confirmado pelo etilômetro.",
    "answer": false,
    "explanation": "ERRADO. A legislação brasileira adota tolerância zero para álcool no sangue. Álcool alveolar residual de enxaguante dissipa em 15 minutos; se persistir, é infração."
  },
  {
    "id": "contran-prf-55",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "Se o condutor alegar uso recente de enxaguante bucal, o agente de trânsito pode aguardar intervalo de 15 minutos para efetuar o teste no etilômetro.",
    "answer": true,
    "explanation": "CERTO. A recomendação operacional oficial permite aguardar cerca de 15 minutos para dissipação de álcool por enxaguante antes do sopro oficial."
  },
  {
    "id": "contran-prf-56",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "A validade da verificação metrológica periódica do etilômetro pelo Inmetro é de 5 anos a contar da data de sua calibração de fábrica.",
    "answer": false,
    "explanation": "ERRADO. A validade da verificação metrológica periódica do Inmetro para etilômetros é de no máximo 12 (doze) meses."
  },
  {
    "id": "contran-prf-57",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025, Anexo I",
    "statement": "Para configuração do crime do art. 306 do CTB por etilômetro, o valor considerado na medição deve ser igual ou superior a 0,34 mg/L de ar alveolar.",
    "answer": true,
    "explanation": "CERTO. Descontada a margem de erro admissível pela tabela do Inmetro/CONTRAN, o valor considerado para o crime deve atingir ou superar 0,34 mg/L."
  },
  {
    "id": "contran-prf-58",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Art. 306, § 1º, II do CTB e Res. 1031",
    "statement": "A recusa ao etilômetro impede a caracterização do crime de trânsito por embriaguez, ainda que o agente apresente sinais notórios de alteração psicomotora.",
    "answer": false,
    "explanation": "ERRADO. O Art. 306, § 1º, II do CTB permite constatar o crime por sinais visíveis de alteração psicomotora atestados por vídeos, perícia e termo de constatação."
  },
  {
    "id": "contran-prf-59",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "A fiscalização de substâncias psicoativas diferentes do álcool pode ser comprovada por exame clínico com laudo firmado por médico perito oficial.",
    "answer": true,
    "explanation": "CERTO. Substâncias psicoativas que causem dependência são atestadas por exames periciais, laboratoriais ou exame clínico oficial."
  },
  {
    "id": "contran-prf-60",
    "category": "CONTRAN",
    "topic": "Alcoolemia e Substâncias Psicoativas (Res. 1031)",
    "legalBasis": "Resolução CONTRAN nº 1031/2025",
    "statement": "O auto de infração por recusa (art. 165-A) é nulo de pleno direito caso o policial não anexe o comprovante impresso de impressão do etilômetro.",
    "answer": false,
    "explanation": "ERRADO. Na recusa, como o infrator se nega a soprar, não há medição impressa do etilômetro, bastando o registro circunstanciado da recusa no auto."
  },
  {
    "id": "contran-prf-61",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025, Art. 2º",
    "statement": "Nos termos da Resolução CONTRAN nº 1020/2025, o processo de habilitação tem início com a abertura do Registro Nacional de Condutores Habilitados (Renach).",
    "answer": true,
    "explanation": "CERTO. Art. 2º da Res. 1020/2025: O processo de habilitação é cadastrado no Renach pelo órgão executivo de trânsito do Estado ou DF."
  },
  {
    "id": "contran-prf-62",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O prazo de validade do processo de primeira habilitação após aberto no Renach é indeterminado e não expira em nenhuma hipótese legal.",
    "answer": false,
    "explanation": "ERRADO. O processo de habilitação possui prazo de validade determinado (normalmente 12 meses, prorrogável apenas em regime de exceção regulamentar)."
  },
  {
    "id": "contran-prf-63",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN 1020 c/c 148-A CTB",
    "statement": "A realização de exame toxicológico de larga janela de detecção é requisito obrigatório para obtenção e renovação das categorias C, D e E de CNH.",
    "answer": true,
    "explanation": "CERTO. Pelo Art. 148-A do CTB e Res. 1020, o exame toxicológico é indispensável para condutores de categorias profissionais (C, D e E)."
  },
  {
    "id": "contran-prf-64",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O exame toxicológico periódico com resultado positivo autoriza o motorista a continuar dirigindo profissionalmente mediante termo de compromisso.",
    "answer": false,
    "explanation": "ERRADO. O resultado positivo no toxicológico acarreta a suspensão do direito de dirigir pelo período de 3 meses, condicionada a liberação a contraprova negativa."
  },
  {
    "id": "contran-prf-65",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "A reprovação no exame de aptidão física e mental ou na avaliação psicológica enseja a interrupção temporária do processo de habilitação do candidato.",
    "answer": true,
    "explanation": "CERTO. Candidato considerado inapto temporário deve aguardar a reavaliação médica ou psicológica para prosseguir com as etapas de habilitação."
  },
  {
    "id": "contran-prf-66",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O candidato reprovado no exame prático de direção veicular deve aguardar o prazo obrigatório e fixo de 90 dias úteis para realizar novo exame prático.",
    "answer": false,
    "explanation": "ERRADO. A Lei 14.071/2020 revogou a exigência de espera mínima de 15 dias para refazer exames práticos ou teóricos; 90 dias é manifestamente inverídico."
  },
  {
    "id": "contran-prf-67",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "A Licença de Aprendizagem de Direção Veicular (LADV) expedida pelo órgão executivo de trânsito autoriza o candidato a treinar sob supervisão de instrutor.",
    "answer": true,
    "explanation": "CERTO. A LADV é o documento que permite o aprendizado de direção veicular em vias públicas, obrigatoriamente acompanhado de instrutor credenciado."
  },
  {
    "id": "contran-prf-68",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O candidato flagrado conduzindo veículo sem a presença do instrutor credenciado tem a sua LADV suspensa pelo prazo irrecorrível de 24 meses.",
    "answer": false,
    "explanation": "ERRADO. O candidato flagrado dirigindo desacompanhado do instrutor terá a LADV suspensa pelo prazo regulamentar de 6 (seis) meses."
  },
  {
    "id": "contran-prf-69",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "Para a condução de veículos de transporte de emergência ou escolar, é indispensável a aprovação em curso especializado registrado no prontuário do condutor.",
    "answer": true,
    "explanation": "CERTO. O transporte escolar, de emergência, coletivo de passageiros e cargas perigosas exige conclusão de curso especializado específico homologado."
  },
  {
    "id": "contran-prf-70",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "A realização de aulas em simulador de direção veicular é requisito legal indispensável e estritamente obrigatório para obtenção da categoria B de CNH.",
    "answer": false,
    "explanation": "ERRADO. O uso de simulador de direção veicular na categoria B passou a ser FACULTATIVO por deliberação do CONTRAN."
  },
  {
    "id": "contran-prf-71",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "A alteração de dados cadastrais na CNH, como inclusão do exercício de atividade remunerada (EAR), exige a realização de nova avaliação psicológica.",
    "answer": true,
    "explanation": "CERTO. Art. 147, § 3º do CTB e Res. 1020: O condutor que pretender exercer atividade remunerada ao veículo deve submeter-se a avaliação psicológica."
  },
  {
    "id": "contran-prf-72",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O condutor habilitado na categoria A pode conduzir quadriciclos automotores em rodovias federais sem qualquer exigência de capacete de segurança.",
    "answer": false,
    "explanation": "ERRADO. A condução de quadriciclos motorizados em vias públicas exige CNH categoria B e uso obrigatório de capacete motociclístico com viseira."
  },
  {
    "id": "contran-prf-73",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O exame toxicológico analisa amostras de queratina (cabelos ou pelos) para detecção de substâncias psicoativas consumidas em janela mínima de 90 dias.",
    "answer": true,
    "explanation": "CERTO. O exame toxicológico de larga janela de detecção analisa materiais queratínicos cobrindo o histórico mínimo retrospectivo de 90 dias."
  },
  {
    "id": "contran-prf-74",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Art. 165-C do CTB e Res. 1020",
    "statement": "O condutor com resultado positivo no exame toxicológico periódico não comete infração de trânsito se não for flagrado dirigindo no momento da coleta.",
    "answer": false,
    "explanation": "ERRADO. O Art. 165-C do CTB pune dirigir veículo com toxicológico vencido ou positivo, e o Art. 165-D pune o simples ato de não realizar o exame periódico."
  },
  {
    "id": "contran-prf-75",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O curso de reciclagem para condutor infrator penalizado com suspensão pode ser realizado presencialmente ou na modalidade de ensino à distância homologada.",
    "answer": true,
    "explanation": "CERTO. O CONTRAN regulamenta o curso de reciclagem tanto na forma presencial em CFCs quanto por meio de EAD em entidades credenciadas."
  },
  {
    "id": "contran-prf-76",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O titular de CNH estrangeira residente no Brasil pode dirigir indefinidamente com sua habilitação de origem sem necessidade de reconhecimento pelo Renach.",
    "answer": false,
    "explanation": "ERRADO. O condutor estrangeiro pode dirigir por até 180 dias com visto/documento de seu país; após isso, deve obter a CNH brasileira equivalente."
  },
  {
    "id": "contran-prf-77",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "A CNH pode ser expedida no formato digital com QR Code e certificado de segurança, garantindo interoperabilidade com bases oficiais da Senatran.",
    "answer": true,
    "explanation": "CERTO. A CNH-e é gerada no aplicativo da Carteira Digital de Trânsito (CDT) com QR Code criptográfico verificado por aplicativo oficial."
  },
  {
    "id": "contran-prf-78",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "O veículo de autoescola (CFC) utilizado no exame prático de direção é dispensado de possuir comando duplo de freio e embreagem pedagógicos.",
    "answer": false,
    "explanation": "ERRADO. Os veículos de instrução prática de CFC das categorias B e C devem possuir obrigatoriamente comandos duplos de freio e embreagem."
  },
  {
    "id": "contran-prf-79",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN nº 1020/2025",
    "statement": "Para conduzir veículos de transporte de produtos perigosos (MOPP), o condutor deve ser maior de 21 anos, habilitado na categoria B, C, D ou E e aprovado em curso.",
    "answer": true,
    "explanation": "CERTO. O curso MOPP exige idade mínima de 21 anos, habilitação em categoria compatível (B, C, D ou E) e não estar cumprindo suspensão ou cassação."
  },
  {
    "id": "contran-prf-80",
    "category": "CONTRAN",
    "topic": "Formação do Condutor e Exames (Res. 1020)",
    "legalBasis": "Resolução CONTRAN 1020 c/c 261 CTB",
    "statement": "A pontuação máxima admitida no prontuário para o condutor exercer atividade remunerada ao volante é reduzida automaticamente para 10 pontos em 12 meses.",
    "answer": false,
    "explanation": "ERRADO. O condutor com EAR na CNH tem o limite fixo ampliado de 40 pontos, independentemente da quantidade e gravidade das infrações cometidas."
  },
  {
    "id": "contran-prf-81",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 960/2022, Art. 4º",
    "statement": "Conforme a Resolução CONTRAN nº 960/2022, a transmitância luminosa mínima permitida para os vidros das áreas envidraçadas indispensáveis à dirigibilidade é de 70%.",
    "answer": true,
    "explanation": "CERTO. Art. 4º da Resolução 960/2022: a transmitância luminosa não poderá ser inferior a 70% para as áreas envidraçadas indispensáveis à dirigibilidade."
  },
  {
    "id": "contran-prf-82",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 960/2022, Art. 6º",
    "statement": "A aplicação de películas refletivas ou espelhadas é expressamente autorizada nos vidros do para-brisa de automóveis de passeio.",
    "answer": false,
    "explanation": "ERRADO. O Art. 6º da Resolução 960/2022 veda terminantemente a aplicação de películas refletivas ou opacas em qualquer área envidraçada do veículo."
  },
  {
    "id": "contran-prf-83",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 960/2022, Art. 7º",
    "statement": "A medição da transmitância luminosa dos vidros pelo policial rodoviário federal deve ser realizada com Medidor de Transmitância Luminosa (MTL) aprovado pelo Inmetro.",
    "answer": true,
    "explanation": "CERTO. Art. 7º: A medição da transmitância luminosa deve ser efetuada por Medidor de Transmitância Luminosa (MTL) homologado pelo Senatran e Inmetro."
  },
  {
    "id": "contran-prf-84",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 798/2020",
    "statement": "O uso de medidor de velocidade do tipo radar portátil pela PRF é vedado em qualquer trecho de rodovia federal, mesmo com sinalização viária visível.",
    "answer": false,
    "explanation": "ERRADO. A Resolução 798/2020 autoriza o uso de radares portáteis em rodovias, desde que em trechos fiscalizados com estudo prévio e sinalização regulamentar R-19."
  },
  {
    "id": "contran-prf-85",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 798/2020, Art. 3º",
    "statement": "Conforme a Resolução CONTRAN nº 798/2020, os medidores de velocidade devem possuir estudo técnico que comprove a necessidade de sua instalação e aprovação do Inmetro.",
    "answer": true,
    "explanation": "CERTO. Art. 3º e 4º da Resolução 798/2020: os radares fixos exigem estudo técnico de criticidade viária e aprovação metrológica do Inmetro."
  },
  {
    "id": "contran-prf-86",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 938/2022",
    "statement": "O registrador instantâneo inalterável de velocidade e tempo (cronotacógrafo) é equipamento obrigatório para todos os veículos de passageiros, inclusive carros de passeio.",
    "answer": false,
    "explanation": "ERRADO. O cronotacógrafo é obrigatório para veículos de carga > 4.536 kg, escolares e coletivo de passageiros > 10 passageiros, NÃO para carros de passeio."
  },
  {
    "id": "contran-prf-87",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 938/2022, Art. 2º",
    "statement": "O cronotacógrafo é obrigatório para veículos de carga com PBT superior a 4.536 kg e veículos de transporte coletivo de passageiros com mais de 10 lugares.",
    "answer": true,
    "explanation": "CERTO. Art. 2º da Resolução 938/2022: o equipamento é obrigatório para transporte escolar, coletivo > 10 passageiros e carga > 4.536 kg."
  },
  {
    "id": "contran-prf-88",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 938/2022",
    "statement": "O motorista de caminhão obrigado a usar cronotacógrafo pode trafegar com o equipamento sem disco diagrama ou bobina de papel caso apresente nota fiscal da carga.",
    "answer": false,
    "explanation": "ERRADO. Conduzir veículo sem disco ou bobina no cronotacógrafo, ou com ele inoperante, é infração grave com retenção do veículo (Art. 230, XIV do CTB)."
  },
  {
    "id": "contran-prf-89",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 996/2023, Art. 2º",
    "statement": "Conforme a Resolução CONTRAN nº 996/2023, ciclomotor é o veículo de duas ou três rodas com motor de combustão de até 50 cm³ ou elétrico de até 4 kW e velocidade máxima de 50 km/h.",
    "answer": true,
    "explanation": "CERTO. Art. 2º da Resolução 996/2023 define ciclomotor: motor a combustão de até 50 cm³ ou potência elétrica de até 4.000 W e velocidade máxima de fabricação de até 50 km/h."
  },
  {
    "id": "contran-prf-90",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 996/2023",
    "statement": "Os ciclomotores são equiparados a bicicletas elétricas, sendo dispensados de registro, licenciamento e emplacamento no órgão executivo de trânsito.",
    "answer": false,
    "explanation": "ERRADO. Ciclomotores são veículos automotores e exigem obrigatoriamente registro, licenciamento anual e emplacamento no DETRAN."
  },
  {
    "id": "contran-prf-91",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 996/2023",
    "statement": "Para conduzir ciclomotor em via pública é obrigatória a posse de Autorização para Conduzir Ciclomotor (ACC) ou Carteira Nacional de Habilitação na categoria A.",
    "answer": true,
    "explanation": "CERTO. A condução de ciclomotor exige documento de habilitação oficial: Autorização para Conduzir Ciclomotor (ACC) ou CNH categoria A."
  },
  {
    "id": "contran-prf-92",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN 996 c/c 57 CTB",
    "statement": "Os ciclomotores têm trânsito livre e preferencial nas pistas expressas e faixas esquerdas de todas as rodovias federais com limite de 110 km/h.",
    "answer": false,
    "explanation": "ERRADO. Art. 57 do CTB: Os ciclomotores devem ser conduzidos pela direita da pista e é PROIBIDO seu trânsito em rodovias que não possuam acostamento."
  },
  {
    "id": "contran-prf-93",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 996/2023, Art. 2º",
    "statement": "As bicicletas elétricas com potência de até 1.000 W e velocidade máxima de 32 km/h dotadas de pedal assistido dispensam CNH e licenciamento.",
    "answer": true,
    "explanation": "CERTO. Bicicleta elétrica com potência até 1.000 W, velocidade até 32 km/h, pedal assistido (sem acelerador manual) dispensa registro, emplacamento e CNH."
  },
  {
    "id": "contran-prf-94",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Art. 167 CTB e Res. 960",
    "statement": "A ausência ou inoperância do cinto de segurança em veículo em que ele é obrigatório configura infração leve punida exclusivamente com advertência verbal.",
    "answer": false,
    "explanation": "ERRADO. Art. 167 e Art. 230, IX do CTB: conduzir veículo sem equipamento obrigatório ou com cinto inoperante é infração GRAVE, com multa e retenção."
  },
  {
    "id": "contran-prf-95",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 919/2022",
    "statement": "O extintor de incêndio com carga de pó ABC é equipamento de uso facultativo para automóveis, utilitários, camionetas e caminhonetes de passeio.",
    "answer": true,
    "explanation": "CERTO. Pela Resolução 919/2022 do CONTRAN, o extintor de incêndio é facultativo para automóveis e utilitários de passeio particulares."
  },
  {
    "id": "contran-prf-96",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 919/2022",
    "statement": "O extintor de incêndio permanece equipamento obrigatório apenas para motocicletas, motonetas e ciclomotores que realizem entrega de carga (motofrete).",
    "answer": false,
    "explanation": "ERRADO. Motocicletas e ciclomotores nunca tiveram extintor obrigatório. O extintor é obrigatório para caminhões, ônibus, vans e transporte de inflamáveis."
  },
  {
    "id": "contran-prf-97",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 948/2022",
    "statement": "O dispositivo retrorrefletivo de segurança (faixas refletivas) é obrigatório nas laterais e na traseira de veículos de carga com PBT superior a 4.536 kg.",
    "answer": true,
    "explanation": "CERTO. A Resolução 948/2022 obriga a aposição de películas retrorrefletivas de segurança nas laterais e no para-choque traseiro de veículos de carga > 4.536 kg."
  },
  {
    "id": "contran-prf-98",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 960/2022",
    "statement": "A presença de trinca no para-brisa em qualquer dimensão ou local da área de visão crítica do condutor nunca impede a circulação do veículo em rodovia.",
    "answer": false,
    "explanation": "ERRADO. A Resolução 960/2022 proíbe expressamente trincas ou fraturas na área crítica de visão do condutor e na faixa periférica de 20 cm do para-brisa."
  },
  {
    "id": "contran-prf-99",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Resolução CONTRAN nº 938/2022",
    "statement": "A verificação periódica do cronotacógrafo pelo Inmetro ou posto autorizado deve ocorrer a cada 2 anos, comprovada por certificado de verificação metrológica.",
    "answer": true,
    "explanation": "CERTO. A Resolução 938/2022 estabelece a periodicidade bienal (2 anos) para a verificação metrológica e selagem do cronotacógrafo."
  },
  {
    "id": "contran-prf-100",
    "category": "CONTRAN",
    "topic": "Equipamentos e Fiscalização (Res. 960, 798, 938, 996)",
    "legalBasis": "Art. 230, III do CTB e Res. 960",
    "statement": "Equipamentos que utilizem antirradar ou dispositivos capazes de ocultar ou fraudar a identificação das placas do veículo são tolerados pela legislação.",
    "answer": false,
    "explanation": "ERRADO. Conduzir veículo com dispositivo antirradar ou dispositivo antirreflexo para ocultar placa é infração gravíssima com apreensão e remoção."
  }
];

export function getRandomCuratedQuestion(
  category: QuestionCategory,
  seenIds?: Set<string>
): ActiveRoundQuestion | null {
  let pool = CURATED_PRF_QUESTIONS.filter((q) => q.category === category);
  if (seenIds && seenIds.size > 0) {
    const unread = pool.filter((q) => !seenIds.has(q.id));
    if (unread.length > 0) {
      pool = unread;
    } else {
      // Se todos os 100 itens da categoria já foram vistos, inicia novo ciclo sem repetir no mesmo bloco
      pool.forEach((q) => seenIds.delete(q.id));
    }
  }
  if (pool.length === 0) return null;

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: `${chosen.id}-${Date.now()}`,
    uniqueHash: `${chosen.id}-${Date.now()}`,
    category: chosen.category,
    topic: chosen.topic,
    legalBasis: chosen.legalBasis,
    statement: chosen.statement,
    answer: chosen.answer,
    explanation: chosen.explanation,
  };
}
