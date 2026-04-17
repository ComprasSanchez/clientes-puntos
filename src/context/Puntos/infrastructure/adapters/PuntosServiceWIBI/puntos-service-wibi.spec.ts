import axios from 'axios';
import { PuntosServiceWIBI } from './PuntosServiceWIBI';

jest.mock('axios');

describe('PuntosServiceWIBI', () => {
  let service: PuntosServiceWIBI;
  let axiosMock: jest.Mocked<typeof axios>;

  const prevApiUrl = process.env.WIBI_API_URL;
  const prevTokenUrl = process.env.WIBI_TOKEN_URL;
  const prevApiKey = process.env.WIBI_API_KEY;
  const prevUser = process.env.WIBI_USER;
  const prevPass = process.env.WIBI_PASS;

  beforeEach(() => {
    axiosMock = axios as jest.Mocked<typeof axios>;
    (axios as unknown as jest.Mock).mockReset();
    axiosMock.post.mockReset();

    process.env.WIBI_API_URL = 'https://api.wibi.com.ar/onzecrm';
    process.env.WIBI_TOKEN_URL = 'https://api.wibi.com.ar/onzecrm/token';
    process.env.WIBI_API_KEY = 'api-key';
    process.env.WIBI_USER = 'user';
    process.env.WIBI_PASS = 'pass';

    service = new PuntosServiceWIBI();
  });

  afterAll(() => {
    process.env.WIBI_API_URL = prevApiUrl;
    process.env.WIBI_TOKEN_URL = prevTokenUrl;
    process.env.WIBI_API_KEY = prevApiKey;
    process.env.WIBI_USER = prevUser;
    process.env.WIBI_PASS = prevPass;
  });

  it('obtiene saldo actual desde WIBI consultando por nroTarjeta', async () => {
    axiosMock.post.mockResolvedValue({
      data: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <auth>
    <token>jwt-token</token>
    <exp>1756813798</exp>
  </auth>
</RespuestaFidelyGb>`,
    } as never);

    (axios as unknown as jest.Mock).mockResolvedValue({
      data: `<?xml version="1.0" encoding="utf-8"?>
<RespuestaFidelyGb>
  <RespCode>0</RespCode>
  <RespMsg>OK</RespMsg>
  <Cliente>
    <Puntos>500</Puntos>
  </Cliente>
</RespuestaFidelyGb>`,
    });

    const saldo = await service.obtenerSaldoActualByTarjeta('118228137');

    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledTimes(1);
    const requestConfig = (axios as unknown as jest.Mock).mock.calls[0]?.[0] as {
      data?: string;
    };
    expect(String(requestConfig.data ?? '')).toContain(
      '<NroTarjeta>118228137</NroTarjeta>',
    );
    expect(saldo).toBe(500);
  });
});
