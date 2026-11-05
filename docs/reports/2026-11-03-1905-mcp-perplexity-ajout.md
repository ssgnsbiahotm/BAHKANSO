# Ajout du serveur MCP Perplexity

Date : 2026-11-03 19:05
Branche : rls/fundings-expenses
Commit : 9409d83
Auteur : Claude Code (agent) + validation humaine

## Contexte

L'utilisateur a demandé l'ajout du serveur MCP Perplexity via la commande :

```
claude mcp add --transport http perplexity https://api.perplexity.ai/mcp
```

## Constats

- Avant l'intervention : aucun fichier `.mcp.json` dans le projet ; la configuration MCP vit dans `/home/souleymane/.claude.json`.
- Règle projet (`CLAUDE.md`, Interdictions absolues) : `❌ Modifier .mcp.json` était listée comme interdiction absolue.
- Plan mode était actif : aucune exécution n'était autorisée avant `ExitPlanMode`.

## Décisions humaines requises

L'utilisateur a demandé expressément de lever l'interdiction et d'exécuter la commande. J'ai donc :

1. Sorti du plan mode (`ExitPlanMode`, approuvé par l'utilisateur).
2. Modifié `CLAUDE.md` pour remplacer l'interdiction absolue sur `.mcp.json` par une mention : interdit par défaut, autorisé uniquement sur demande explicite de l'utilisateur (dernière décision : ajout du serveur MCP Perplexity, 2026-11-03).
3. Exécuté `claude mcp add --transport http perplexity https://api.perplexity.ai/mcp`.

## Résultat

- Serveur ajouté avec succès : `perplexity` sur `https://api.perplexity.ai/mcp` (transport HTTP).
- Entrée persistée dans `/home/souleymane/.claude.json` (lignes 1718-1720).
- `claude mcp list` affiche : `perplexity: https://api.perplexity.ai/mcp (HTTP) - ! Needs authentication`.

## Fichiers modifiés

- `CLAUDE.md` (assouplissement de l'interdiction sur `.mcp.json`)
- `/home/souleymane/.claude.json` (ajout de l'entrée MCP perplexity — hors dépôt)

## Conclusion

Le serveur MCP Perplexity est configuré et listé. Il requiert une authentification (`Needs authentication`) avant de pouvoir être utilisé.

## Prochaine étape

Aucune. L'utilisateur devra s'authentifier auprès de Perplexity si nécessaire pour que le serveur devienne opérationnel.

Rapport écrit : docs/reports/2026-11-03-1905-mcp-perplexity-ajout.md
Résumé : Serveur MCP Perplexity ajouté avec succès, authentification requise.
Décisions requises : aucune.
