import { useLayoutEffect, useEffect, useInsertionEffect } from 'react';

const crateIsomorphicEffects = <T>(clientSide: T, serverSide: T) =>
    typeof window !== 'undefined' ? clientSide : serverSide;

const useIsomorphicLayoutEffect = crateIsomorphicEffects(useLayoutEffect, useEffect);
const useIsomorphicInsertionEffect = crateIsomorphicEffects(useInsertionEffect, useEffect);

export { useIsomorphicLayoutEffect, useIsomorphicInsertionEffect };
