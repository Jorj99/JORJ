import { useRef } from 'react';
import { useIsomorphicInsertionEffect } from './customEffects';

function useLatest<T>(value: T) {
    const ref = useRef<T>(value);

    useIsomorphicInsertionEffect(() => {
        ref.current = value;
    });

    return ref.current;
}

export default useLatest;
