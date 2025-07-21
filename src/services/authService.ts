import { v4 as uuidv4 } from 'uuid';
import { UserRole, Client, AuthState, SubscriptionStatus, AdminAuthState, SoloAuthState, ClientAuthState } from '../types';
import { storageService } from './storageService';
import { SOLO_USER_CLIENT_ID, TRAINER_CLIENT_ID } from '../constants';

const AUTH_KEY = 'fit_track_auth_state';
const TRAINER_PASSKEY_ID_KEY = 'fit_track_trainer_passkey_id';
const SOLO_PASSKEY_ID_KEY = 'fit_track_solo_passkey_id';

// Static, stable user handles for passkey registration.
const TRAINER_USER_HANDLE = 'trainer-user-handle-stable-id';
const SOLO_USER_HANDLE = 'solo-user-handle-stable-id';


// Helper to convert between ArrayBuffer and Base64URL
const bufferEncode = (value: ArrayBuffer) => {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(value))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

const bufferDecode = (value: string) => {
    value = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = value.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error("InvalidLengthError: Input base64url string is the wrong length to determine padding");
        }
        value += new Array(5 - pad).join("=");
    }
    const raw = atob(value);
    const buffer = new ArrayBuffer(raw.length);
    const arr = new Uint8Array(buffer);
    for (let i = 0; i < raw.length; i++) {
        arr[i] = raw.charCodeAt(i);
    }
    return buffer;
}

const stringToBuffer = (str: string): Uint8Array => {
  return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
}


const createPasskey = async (options: CredentialCreationOptions) => {
    try {
        const credential = await navigator.credentials.create(options) as PublicKeyCredential;
        if (credential && credential.rawId) {
            return bufferEncode(credential.rawId);
        }
        throw new Error("Credential creation failed or returned an invalid object.");
    } catch (err) {
        console.error("Passkey registration failed:", err);
        throw new Error("Could not create passkey. Your browser may not support it or you may have cancelled the request.");
    }
};

const getPasskey = async (options: CredentialRequestOptions) => {
     try {
        const assertion = await navigator.credentials.get(options);
        return !!assertion;
    } catch (err) {
        console.error("Passkey authentication failed:", err);
        return false;
    }
};


export const authService = {
    saveAuthState: (state: AuthState) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify(state));
    },

    getAuthState: (): AuthState | null => {
        const state = localStorage.getItem(AUTH_KEY);
        try {
            return state ? JSON.parse(state) : null;
        } catch {
            return null;
        }
    },

    clearAuthState: () => {
        localStorage.removeItem(AUTH_KEY);
    },
    
    // --- Login functions that create full auth state ---
    loginTrainer: (): AdminAuthState => {
        authService.ensureTrainerProfile();
        return {
            role: UserRole.Admin,
            subscriptionStatus: localStorage.getItem('fit_track_admin_sub') === 'pro' ? 'pro' : 'free',
            stripeConnected: localStorage.getItem('fit_track_stripe_connected') === 'true',
        };
    },

    loginSolo: (): SoloAuthState => ({
        role: UserRole.Solo,
        clientId: authService.ensureSoloUserProfile(),
        subscriptionStatus: localStorage.getItem('fit_track_solo_sub') === 'pro' ? 'pro' : 'free',
    }),
    
    loginClient: (clientId: string): ClientAuthState => ({
        role: UserRole.Client,
        clientId,
    }),

    // --- Subscription Status ---
    setSubscriptionStatus: (role: UserRole.Admin | UserRole.Solo, status: SubscriptionStatus) => {
        const key = role === UserRole.Admin ? 'fit_track_admin_sub' : 'fit_track_solo_sub';
        localStorage.setItem(key, status);
        const currentAuth = authService.getAuthState();
        if(currentAuth && currentAuth.role === role) {
            authService.saveAuthState({ ...currentAuth, subscriptionStatus: status });
        }
    },

    // --- Stripe Connection for Trainer ---
    connectStripe: () => {
        localStorage.setItem('fit_track_stripe_connected', 'true');
        const currentAuth = authService.getAuthState();
        if(currentAuth && currentAuth.role === UserRole.Admin) {
            authService.saveAuthState({ ...currentAuth, stripeConnected: true });
        }
    },
    
    // --- Trainer Passkey Auth ---
    isTrainerRegistered: async (): Promise<boolean> => !!localStorage.getItem(TRAINER_PASSKEY_ID_KEY),

    registerTrainerPasskey: async (): Promise<void> => {
        const challenge = new Uint8Array(32); crypto.getRandomValues(challenge);
        const options: CredentialCreationOptions = {
            publicKey: {
                challenge,
                rp: { name: "FitTrack AI", id: location.hostname },
                user: { id: stringToBuffer(TRAINER_USER_HANDLE), name: "trainer@fittrack.ai", displayName: "Trainer" },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
                authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                timeout: 60000, attestation: "direct",
            },
        };
        const encodedId = await createPasskey(options);
        localStorage.setItem(TRAINER_PASSKEY_ID_KEY, encodedId);
    },
    
    resetAndRegisterTrainerPasskey: async (): Promise<void> => {
        localStorage.removeItem(TRAINER_PASSKEY_ID_KEY);
        await authService.registerTrainerPasskey();
    },

    authenticateTrainer: async (): Promise<boolean> => {
        const credentialId = localStorage.getItem(TRAINER_PASSKEY_ID_KEY);
        if (!credentialId) throw new Error("No passkey registered for trainer.");
        const challenge = new Uint8Array(32); crypto.getRandomValues(challenge);
        const options: CredentialRequestOptions = {
            publicKey: {
                challenge, timeout: 60000, rpId: location.hostname,
                allowCredentials: [{ type: 'public-key', id: bufferDecode(credentialId), transports: ['internal'] }],
                userVerification: 'required',
            }
        };
        return getPasskey(options);
    },

    // --- Solo User Auth ---
    isSoloUserRegistered: async (): Promise<boolean> => !!localStorage.getItem(SOLO_PASSKEY_ID_KEY),

    registerSoloUserPasskey: async (): Promise<void> => {
        const challenge = new Uint8Array(32); crypto.getRandomValues(challenge);
        const options: CredentialCreationOptions = {
            publicKey: {
                challenge,
                rp: { name: "FitTrack AI", id: location.hostname },
                user: { id: stringToBuffer(SOLO_USER_HANDLE), name: "solo@fittrack.ai", displayName: "Solo User" },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                timeout: 60000, attestation: "direct",
            },
        };
        const encodedId = await createPasskey(options);
        localStorage.setItem(SOLO_PASSKEY_ID_KEY, encodedId);
    },
    
    resetAndRegisterSoloUserPasskey: async (): Promise<void> => {
        localStorage.removeItem(SOLO_PASSKEY_ID_KEY);
        await authService.registerSoloUserPasskey();
    },

    authenticateSoloUser: async (): Promise<boolean> => {
        const credentialId = localStorage.getItem(SOLO_PASSKEY_ID_KEY);
        if (!credentialId) throw new Error("No passkey registered for solo user.");
        const challenge = new Uint8Array(32); crypto.getRandomValues(challenge);
        const options: CredentialRequestOptions = {
            publicKey: {
                challenge, timeout: 60000, rpId: location.hostname,
                allowCredentials: [{ type: 'public-key', id: bufferDecode(credentialId), transports: ['internal'] }],
                userVerification: 'required',
            }
        };
        return getPasskey(options);
    },
    
    // --- Client Passkey Auth ---
    isClientRegistered: (client: Client): boolean => !!client.passkeyId,

    registerClientPasskey: async (clientId: string): Promise<void> => {
        const clients = storageService.getClients();
        const clientIndex = clients.findIndex(c => c.id === clientId);
        if (clientIndex === -1) throw new Error("Client not found.");
        const client = clients[clientIndex];
        
        const challenge = new Uint8Array(32); crypto.getRandomValues(challenge);
        const options: CredentialCreationOptions = {
            publicKey: {
                challenge, rp: { name: "FitTrack AI", id: location.hostname },
                user: { id: stringToBuffer(client.userHandle), name: client.name, displayName: client.name },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                timeout: 60000, attestation: "direct",
            },
        };
        const encodedId = await createPasskey(options);
        clients[clientIndex].passkeyId = encodedId;
        storageService.saveClients(clients);
    },

    authenticateClient: async (clientId: string): Promise<boolean> => {
        const client = storageService.getClients().find(c => c.id === clientId);
        if (!client || !client.passkeyId) throw new Error("No passkey registered for this client.");
        
        const challenge = new Uint8Array(32); crypto.getRandomValues(challenge);
        const options: CredentialRequestOptions = {
            publicKey: {
                challenge, timeout: 60000, rpId: location.hostname,
                allowCredentials: [{ type: 'public-key', id: bufferDecode(client.passkeyId), transports: ['internal'] }],
                userVerification: 'required',
            }
        };
        return getPasskey(options);
    },
    
    resetAndRegisterClientPasskey: async (clientId: string): Promise<void> => {
        const clients = storageService.getClients();
        const clientIndex = clients.findIndex(c => c.id === clientId);
        if (clientIndex === -1) throw new Error("Client not found.");
        
        clients[clientIndex].passkeyId = undefined; // Clear the old ID
        storageService.saveClients(clients);
        
        await authService.registerClientPasskey(clientId); // Register the new one
    },
    
    // --- User Profile Management ---
    ensureTrainerProfile: (): void => {
        const clients = storageService.getClients();
        if (!clients.find(c => c.id === TRAINER_CLIENT_ID)) {
            const newTrainerClient: Client = {
                id: TRAINER_CLIENT_ID, name: 'Me', assignedProgramIds: [],
                notes: 'This is my personal training profile.', status: 'active', userHandle: uuidv4()
            };
            storageService.saveClients([...clients, newTrainerClient]);
        }
    },
    
    ensureSoloUserProfile: (): string => {
        const clients = storageService.getClients();
        const soloClient = clients.find(c => c.id === SOLO_USER_CLIENT_ID);
        if (!soloClient) {
            const newSoloClient: Client = {
                id: SOLO_USER_CLIENT_ID,
                name: 'Me (Solo)',
                assignedProgramIds: [],
                notes: 'This is my personal profile for solo training.',
                status: 'active',
                userHandle: uuidv4(),
            };
            storageService.saveClients([...clients, newSoloClient]);
        }
        return SOLO_USER_CLIENT_ID;
    }
};
