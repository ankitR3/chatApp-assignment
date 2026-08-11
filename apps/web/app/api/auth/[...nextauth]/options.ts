import { AuthOptions, ISODateString} from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import axios from 'axios';
import { LOGIN_URL } from '@/routes/api-routes';

export interface UserType {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string | null;
    token?: string | null;
}

export interface CustomSession {
    user?: UserType;
    expires: ISODateString;
}

export const authOptions: AuthOptions = {
    pages: {
        signIn: '/',
    },

    secret: process.env.NEXTAUTH_SECRET || 'chatapp-secret-key-12345',

    debug: process.env.NODE_ENV === 'development',

    callbacks: {
        async redirect({ url, baseUrl }) {
            if (url === baseUrl || url === '/' || url.includes('api/auth')) {
                return `${baseUrl}/dashboard`;
            }

            if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            }

            if (new URL(url).origin === baseUrl) {
                return url;
            }
            return baseUrl;
        },

        async jwt({ token, user }) {
            if (user) {
                token.user = user as UserType;
            }
            return token;
        },
        async session({ session, token }: {
            session: CustomSession; token: JWT;
        }) {
            session.user = token.user as UserType;
            return session;
        },
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                name: { label: 'Name', type: 'text' }
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    return null;
                }
                try {
                    const response = await axios.post(LOGIN_URL, {
                        user: {
                            email: credentials.email,
                            name: credentials.name || credentials.email.split('@')[0],
                            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(credentials.name || credentials.email)}`
                        }
                    }, {
                        timeout: 10000,
                    });

                    const result = response.data;
                    if (result?.success && result?.user) {
                        return {
                            id: result.user.id.toString(),
                            name: result.user.name,
                            email: result.user.email,
                            image: result.user.image,
                            token: result.token,
                        };
                    }
                    return null;
                } catch (err) {
                    console.log('Authorize error: ', err);
                    return null;
                }
            }
        })
    ],
};