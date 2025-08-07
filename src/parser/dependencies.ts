import {ParseModelResult} from "./def";

export function reverseDependencies(response: ParseModelResult[]) {
    // Mapeia modelos por nome
    const modelMap = new Map<string, ParseModelResult>();
    for (const item of response) {
        item.dependents = []; // limpa dependents antes de começar
        modelMap.set(item.model.model, item);
    }

    // Cria mapa auxiliar para armazenar dependentes indiretos (cache)
    const dependentsMap = new Map<string, Set<string>>();

    // Função recursiva para coletar todos os dependentes de um modelo
    function collectDependents(target: string, visited = new Set<string>()): Set<string> {
        if (dependentsMap.has(target)) {
            return dependentsMap.get(target)!;
        }

        const dependents = new Set<string>();

        for (const model of response) {
            if (model.dependencies.includes(target)) {
                if (!visited.has(model.model.model)) {
                    dependents.add(model.model.model);
                    visited.add(model.model.model);
                    const indirect = collectDependents(model.model.model, new Set(visited));
                    for (const d of indirect) dependents.add(d);
                }
            }
        }

        dependentsMap.set(target, dependents);
        return dependents;
    }

    // Aplica para cada modelo
    for (const item of response) {
        const allDependents = collectDependents(item.model.model);
        item.dependents = [...allDependents];
    }
}

