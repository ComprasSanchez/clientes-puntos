// utils/plex-fidelizar-cliente-parsed.interface.ts

export interface PlexFidelizarClienteParsed {
  MensajeFidelyGb: {
    Proveedor?: { _text: string };
    CodAccion?: { _text: string };
    Cliente: {
      IDClienteFidely?: { _text: string };
      Campania?: { _text: string };
      Categoria?: { _text: string };
      NroTarjetaAnterior?: { _text: string };
      NroTarjeta?: { _text: string };
      DNI?: { _text: string };
      Nombre?: { _text: string };
      Apellido?: { _text: string };
      Sexo?: { _text: string };
      FecNac?: { _text: string };
      Email?: { _text: string };
      Telefono?: { _text: string };
      Direccion?: { _text: string };
      CodPostal?: { _text: string };
      Localidad?: { _text: string };
      Provincia?: { _text: string };
    };
  };
}
