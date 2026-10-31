import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "pt";

const en = {
  browserLocal: "Browser-local review", demoBadge: "Demo — sample data",
  steps: { import: "Import", mandate: "Mandate", review: "Review", export: "Export" },
  staleTitle: "Previous result is stale", staleBody: "Configuration or mandate changed. Confirm any changed mandate and reanalyse before export.", staleBtn: "Review changed mandate",
  heroA: "Compare your agent’s configuration with what you ", heroB: "authorised.", heroSub: "Review configured actions, possible mandate mismatches and the evidence still needed.",
  tryDemo: "Try a demo", tryDemoSub: "Explore a sample review. No setup or personal data needed.",
  checkMine: "Check my configuration", checkMineSub: "Upload or paste your own configuration below.",
  flagRed: "Red flag", flagYellow: "Yellow flag", flagGreen: "Green flag",
  legendRed: "Needs attention: hidden instructions or actions beyond what you allowed", legendYellow: "Unclear: permissions or approvals not proven", legendGreen: "Looks contained in what was supplied",
  pickDemo: "Pick a fictional sample scenario", openReview: "Open review", demoNote: "Fictional sample scenarios, not live integrations. Flags are a quick guide; open the review for the evidence.",
  orExample: "Or load an example configuration", clear: "Clear", pasteLabel: "Paste configuration or tool inventory (JSON)",
  importBtn: "Import configuration", importFile: "Import JSON file", reading: "Reading file…", fileError: "The file could not be read. Try pasting the JSON instead.",
  supported: "Supported: MCP mcpServers/servers, tool arrays or tools objects, and limited n8n Gmail v2 message operations. Other formats and operations remain unknown.",
  privacy: "Your configuration stays in this browser session. It is not stored, executed or sent to an AI service.",
  analyse: "Analyse configuration and mandate", reviewNoMandate: "Review without mandate comparison", backConfig: "Back to configuration",
  viewSample: "View sample configuration", editSample: "Edit sample mandate and rerun", anotherDemo: "Try another demo",
  exportDraft: "Export draft assessment", reanalyse: "Reanalyse", exportStep: "04 / Draft export", draftTitle: "Draft assessment",
  dlMd: "Download Markdown", dlJson: "Download JSON", copyMd: "Copy Markdown", copied: "Copied!", copyError: "Copy is unavailable here. Download the Markdown instead.",
  exportLangNote: "Exported files are written in English so reviewers share one wording.",
  footer: "Not runtime verification or security certification. Built at Vibathon Algarve 2026.",
  // mandate editor
  mStep: "02 / Mandate", mTitle: "What is this agent authorised to do?", mInstruction: "Original business instruction", mExample: "Use customer enquiry example",
  mOwner: "Owner name or role", mDelegation: "Structured delegation", mAdd: "Add rule", mNoRules: "No rules supplied. Add delegation rules or review the example before confirmation.",
  mRule: "Rule", mType: "Rule type", mAction: "Action", mResource: "Resource / scope", mResourcePh: "Resource or * for all scopes", mConditions: "Conditions", mRemove: "Remove rule",
  mExhaustive: "Treat these rules as an exhaustive allowlist. Actions outside the list are not authorised.",
  mHint: "Otherwise, unmentioned actions are Unspecified—review needed. Scope matching uses exact text or an explicit *; conditions require verification.",
  mConfirmed: "Owner-confirmed mandate", mUnconfirmed: "Unconfirmed — review the instruction and rules", mConfirm: "Confirm reviewed mandate",
  // review
  evidence: "View evidence", priority: "Priority", evidenceLbl: "Evidence", mandateRule: "Mandate rule", stillUnknown: "Still unknown", nextVerify: "Next verification",
  rStep: "03 / Configuration review", coverage: "Assessment coverage", servers: "Configured servers", tools: "Declared tools", actions: "Recognised actions", compFindings: "Comparison findings",
  runtime: "Runtime permissions", noServers: "No server inventory supplied in this format.", invNone: "Tool inventory not provided.", invTools: (n: number) => `${n} tools declared in this snapshot.`,
  capsUnknown: "Capabilities: Unknown · Runtime permissions: Not checked", actionsTitle: "Recognised configured actions", noActions: "No configured actions recognised. This does not establish an absence of capabilities.",
  configuredOp: "Configured operation", toolMeta: "Declared tool metadata", capabilities: "Capabilities", hint: "Source-provided hint", notVerified: "not verified",
  mismatches: "Possible mandate mismatches", noMismatch: "No mismatches found in the inspected configuration. Coverage limitations still apply; this does not imply the agent is safe.",
  findings: "Findings and missing evidence", noFindings: "No additional findings in the inspected configuration. Verification remains pending.",
  controls: "Controls — not verified", limits: "Coverage limitations and open questions", pending: "Pending verification",
  engineNote: "", 
  // demo
  dExplain: "Demo explanation", dFictional: "Fictional sample scenario, not a live integration. The sample mandate is a demo preset, not a real owner attestation.",
  dAllows: "What the sample mandate allows", dDeclares: "What the supplied configuration declares or configures",
  dFormat: (f: string, s: number, t: number, a: number) => `Format: ${f}. ${s} configured server(s), ${t} declared tool(s), ${a} recognised configured action(s).`,
  dDeclared: "Declared tools", dMismatch: "What mismatch was found and why it matters", dUnverified: "What could not be verified",
  dUnverifiedBody: "Approval behaviour, credential scope and actual execution are not established by this review.",
};
type Dict = typeof en;

const pt: Dict = {
  browserLocal: "Análise local no navegador", demoBadge: "Demo — dados de exemplo",
  steps: { import: "Importar", mandate: "Mandato", review: "Análise", export: "Exportar" },
  staleTitle: "O resultado anterior está desatualizado", staleBody: "A configuração ou o mandato mudou. Confirme o mandato alterado e volte a analisar antes de exportar.", staleBtn: "Rever mandato alterado",
  heroA: "Compare a configuração do seu agente com o que ", heroB: "autorizou.", heroSub: "Reveja as ações configuradas, possíveis desvios ao mandato e as provas que ainda faltam.",
  tryDemo: "Experimentar uma demo", tryDemoSub: "Explore uma análise de exemplo. Sem configuração nem dados pessoais.",
  checkMine: "Verificar a minha configuração", checkMineSub: "Carregue ou cole a sua própria configuração abaixo.",
  flagRed: "Bandeira vermelha", flagYellow: "Bandeira amarela", flagGreen: "Bandeira verde",
  legendRed: "Requer atenção: instruções ocultas ou ações além do que permitiu", legendYellow: "Pouco claro: permissões ou aprovações não comprovadas", legendGreen: "Parece contido no que foi fornecido",
  pickDemo: "Escolha um cenário fictício de exemplo", openReview: "Abrir análise", demoNote: "Cenários fictícios, não integrações reais. As bandeiras são um guia rápido; abra a análise para ver as provas.",
  orExample: "Ou carregue uma configuração de exemplo", clear: "Limpar", pasteLabel: "Cole a configuração ou o inventário de ferramentas (JSON)",
  importBtn: "Importar configuração", importFile: "Importar ficheiro JSON", reading: "A ler ficheiro…", fileError: "Não foi possível ler o ficheiro. Experimente colar o JSON.",
  supported: "Suportado: MCP mcpServers/servers, listas ou objetos de ferramentas e operações limitadas de mensagens do Gmail v2 no n8n. Outros formatos e operações ficam como desconhecidos.",
  privacy: "A sua configuração fica nesta sessão do navegador. Não é guardada, executada nem enviada a um serviço de IA.",
  analyse: "Analisar configuração e mandato", reviewNoMandate: "Analisar sem comparar com o mandato", backConfig: "Voltar à configuração",
  viewSample: "Ver configuração de exemplo", editSample: "Editar mandato de exemplo e reanalisar", anotherDemo: "Experimentar outra demo",
  exportDraft: "Exportar rascunho da análise", reanalyse: "Reanalisar", exportStep: "04 / Exportar rascunho", draftTitle: "Rascunho da análise",
  dlMd: "Descarregar Markdown", dlJson: "Descarregar JSON", copyMd: "Copiar Markdown", copied: "Copiado!", copyError: "Copiar não está disponível aqui. Descarregue o Markdown.",
  exportLangNote: "Os ficheiros exportados são escritos em inglês para que todos os revisores partilhem a mesma redação.",
  footer: "Não é verificação em tempo de execução nem certificação de segurança. Criado no Vibathon Algarve 2026.",
  mStep: "02 / Mandato", mTitle: "O que este agente está autorizado a fazer?", mInstruction: "Instrução original do negócio", mExample: "Usar exemplo de pedidos de clientes",
  mOwner: "Nome ou função do responsável", mDelegation: "Delegação estruturada", mAdd: "Adicionar regra", mNoRules: "Sem regras. Adicione regras de delegação ou reveja o exemplo antes de confirmar.",
  mRule: "Regra", mType: "Tipo de regra", mAction: "Ação", mResource: "Recurso / âmbito", mResourcePh: "Recurso ou * para todos", mConditions: "Condições", mRemove: "Remover regra",
  mExhaustive: "Tratar estas regras como lista exaustiva. Ações fora da lista não estão autorizadas.",
  mHint: "Caso contrário, ações não mencionadas ficam Não especificadas — requer revisão. O âmbito usa texto exato ou um * explícito; as condições precisam de verificação.",
  mConfirmed: "Mandato confirmado pelo responsável", mUnconfirmed: "Não confirmado — reveja a instrução e as regras", mConfirm: "Confirmar mandato revisto",
  evidence: "Ver provas", priority: "Prioridade", evidenceLbl: "Prova", mandateRule: "Regra do mandato", stillUnknown: "Ainda desconhecido", nextVerify: "Próxima verificação",
  rStep: "03 / Análise da configuração", coverage: "Cobertura da análise", servers: "Servidores configurados", tools: "Ferramentas declaradas", actions: "Ações reconhecidas", compFindings: "Resultados da comparação",
  runtime: "Permissões em execução", noServers: "Nenhum inventário de servidores neste formato.", invNone: "Inventário de ferramentas não fornecido.", invTools: (n: number) => `${n} ferramentas declaradas neste instantâneo.`,
  capsUnknown: "Capacidades: Desconhecidas · Permissões em execução: Não verificadas", actionsTitle: "Ações configuradas reconhecidas", noActions: "Nenhuma ação configurada reconhecida. Isto não prova a ausência de capacidades.",
  configuredOp: "Operação configurada", toolMeta: "Metadados das ferramentas declaradas", capabilities: "Capacidades", hint: "Indicação da fonte", notVerified: "não verificado",
  mismatches: "Possíveis desvios ao mandato", noMismatch: "Nenhum desvio na configuração analisada. As limitações de cobertura mantêm-se; isto não significa que o agente é seguro.",
  findings: "Resultados e provas em falta", noFindings: "Sem resultados adicionais na configuração analisada. A verificação continua pendente.",
  controls: "Controlos — não verificados", limits: "Limitações de cobertura e questões em aberto", pending: "Verificação pendente",
  engineNote: "Os detalhes técnicos de cada resultado são mostrados em inglês, tal como nos ficheiros exportados.",
  dExplain: "Explicação da demo", dFictional: "Cenário fictício, não é uma integração real. O mandato de exemplo é uma predefinição da demo, não uma declaração real de um responsável.",
  dAllows: "O que o mandato de exemplo permite", dDeclares: "O que a configuração fornecida declara ou configura",
  dFormat: (f, s, t, a) => `Formato: ${f}. ${s} servidor(es) configurado(s), ${t} ferramenta(s) declarada(s), ${a} ação(ões) configurada(s) reconhecida(s).`,
  dDeclared: "Ferramentas declaradas", dMismatch: "Que desvio foi encontrado e porque importa", dUnverified: "O que não foi possível verificar",
  dUnverifiedBody: "O comportamento de aprovação, o âmbito das credenciais e a execução real não são estabelecidos por esta análise.",
};

const DICTS: Record<Lang, Dict> = { en, pt };
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({ lang: "en", setLang: () => {}, t: en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => { const s = localStorage.getItem("reachcheck-lang"); if (s === "pt" || s === "en") setLangState(s); }, []);
  useEffect(() => { document.documentElement.lang = lang === "pt" ? "pt-PT" : "en"; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("reachcheck-lang", l); };
  return <Ctx.Provider value={{ lang, setLang, t: DICTS[lang] }}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);

export const PT_DEMOS: Record<string, { title: string; tagline: string }> = {
  "email-assistant": { title: "Assistente Gmail", tagline: "Um assistente Gmail devia apenas redigir respostas, mas a configuração declara uma ferramenta de envio." },
  "chatgpt-connector": { title: "Conector ChatGPT", tagline: "Um conector ChatGPT para notas contém uma instrução escondida na descrição de uma ferramenta." },
  "n8n-inbox-reader": { title: "Leitor de caixa n8n", tagline: "Um fluxo que só lê uma mensagem — exatamente o que o responsável permitiu." },
  "n8n-auto-sender": { title: "Envio automático n8n", tagline: "O responsável disse para nunca enviar emails, mas o fluxo tem um passo de envio." },
  "mcp-assistant": { title: "Assistente Claude / MCP", tagline: "Um assistente devia apenas ler documentos, mas as ferramentas declaradas também incluem editar ficheiros." },
  "n8n-workflow": { title: "Fluxo n8n", tagline: "Um fluxo devia preparar uma resposta para aprovação, mas inclui um passo configurado de envio de email." },
};
export const PT_SAMPLES = ["Só servidor — inventário em falta", "Ferramentas de email declaradas — permissões desconhecidas", "Envenenado — descrição meteorológica suspeita", "Envio Gmail configurado — instantâneo n8n"];
