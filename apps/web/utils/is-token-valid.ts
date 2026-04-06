import { jwtDecode } from "jwt-decode";
import { getUnixTime } from "date-fns";

interface JwtPayload {
  exp: number;
  [key: string]: any;
}

export const isTokenExpired = (token: string) => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return true;
    const now = getUnixTime(new Date());
    return decoded.exp < now;
  } catch {
    return true;
  }
};
