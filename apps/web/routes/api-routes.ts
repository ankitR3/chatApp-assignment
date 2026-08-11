const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not set');
}

export const API_URL = BACKEND_URL + '/api/v1';

export const LOGIN_URL = API_URL + '/auth/login';

export const CREATE_ROOM_URL = API_URL + '/room/create-room';
export const JOIN_ROOM_URL = API_URL + '/room/join-room';
export const EXIT_ROOM_URL = API_URL + '/room/exit-room';
export const DELETE_ROOM_URL = API_URL + '/room/delete-room';
export const GET_ROOM_URL = API_URL + '/room/list-rooms';
export const ROOM_CHECK_URL = (id: string) => API_URL + `/room/rooms/${id}`;
export const EXPLORE_ROOM_URL = API_URL + '/room/explore';
export const SEARCH_USERS_URL = API_URL + '/room/search-users';
export const DIRECT_ROOM_URL = API_URL + '/room/direct-room';

export const SEND_MESSAGE_URL = API_URL + '/chat/send-message';
export const GET_MESSAGE_URL = (roomId: string) => API_URL + `/chat/get-message/${roomId}`;
export const EDIT_MESSAGE_URL = API_URL + '/chat/edit-message';
export const DELETE_MESSAGE_URL = API_URL + '/chat/delete-message';