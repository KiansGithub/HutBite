import { router, usePathname } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export function useAuthGate() {
    const { user } = useAuthStore();
    const pathname = usePathname();

    const ensureAuthed = (action?: () => void) => {
        if (user) {
            action?.();
            return true;
        }
        // send user to sign-in, then back to where they were 
        router.push({ pathname: "/auth/sign-in", params: { next: pathname } });
        return false; 
    };

    return { ensureAuthed, isAuthed: !!user };
}