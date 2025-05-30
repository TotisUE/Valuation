// src/utils/questionHelpers.js

export const getAssociatedNumericFieldsForChannel = (channelUseValueKey) => {
    // Ejemplo: m2l_meta_ads_use
    if (!channelUseValueKey.endsWith('_use') && 
        channelUseValueKey !== 'm2l_referral_formal_programs' && // Casos especiales que no terminan en _use
        !channelUseValueKey.includes('_list')) { // Casos especiales de listas
        // Si no es un tipo de pregunta que esperamos que resetee campos, retornar array vacío.
        // O podrías hacer esta validación en el llamador.
        // Por ahora, la lógica original asumía que si llegaba aquí, era una de esas.
    }

    const baseKey = channelUseValueKey.replace('_use', ''); 
    
    // Lógica para determinar si es "paid" (esto podría mejorarse con más info de la pregunta)
    const isPaidChannel = baseKey.includes('_ads') || baseKey.includes('otherPaidChannels');

    let associatedFields = [];

    // Casos especiales primero
    if (channelUseValueKey === 'm2l_otherPaidChannels_list') {
        associatedFields = ['m2l_otherPaidChannels_customerPercent', 'm2l_otherPaidChannels_monthlySpend'];
    } else if (channelUseValueKey === 'm2l_otherOrganicChannels_list') {
        associatedFields = ['m2l_otherOrganicChannels_customerPercent'];
    } else if (channelUseValueKey === 'm2l_referral_formal_programs') {
        associatedFields = ['m2l_referral_customerPercent', 'm2l_referral_internalExternalPercent'];
    } else if (channelUseValueKey.endsWith('_use')) { // Para los canales estándar _use
        associatedFields.push(`${baseKey}_customerPercent`);
        associatedFields.push(`${baseKey}_warmTrafficPercent`);
        if (isPaidChannel) {
            associatedFields.push(`${baseKey}_monthlySpend`);
        }
    }
    
    return associatedFields;
};
