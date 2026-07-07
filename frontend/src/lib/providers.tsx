import { useEffect, useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMe } from "@/store/auth-slice";

function Hydrator({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    dispatch(fetchMe());
  }, [dispatch]);
  // Wait for hydration before rendering children to prevent hydration mismatch
  if (!hydrated) {
    return null;
  }
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <Hydrator>{children}</Hydrator>
    </Provider>
  );
}
