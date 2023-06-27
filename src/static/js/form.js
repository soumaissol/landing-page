document.addEventListener("alpine:init", () => {
  const UNEXPECTED_ERROR = "Erro inesperado. Por favor, tente mais tarde";
  const FORM_URL =
    "https://0upoqn2yxc.execute-api.sa-east-1.amazonaws.com/prod/contacts";

  Alpine.data("contactForm", () => ({
    success: false,
    hasError: false,
    loading: false,
    buttonText: "Enviar",
    errorMessage: "",
    data: {
      email: "",
      phone: "",
      fullName: "",
      zip: "",
      energyConsumption: "",
      creci: "",
    },
    async submitForm() {
      console.log(JSON.stringify(this.data));

      this.errorMessage = "";
      this.hasError = false;
      this.loading = true;
      this.buttonText = "Processando...";
      this.success = false;

      const body = this.data;
      body.zip = (body.zip || "").replaceAll(/[\-]/g, "");

      const response = await fetch(FORM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        this.success = true;

        for (let prop in this.data) {
          this.data[prop] = "";
        }
      } else {
        const body = await response.text();
        let error;
        try {
          const json = JSON.parse(body);
          error = json.errors[0]?.message || UNEXPECTED_ERROR;
        } catch (exception) {
          console.error(exception);
          error = UNEXPECTED_ERROR;
        }

        this.hasError = true;
        this.errorMessage = error;
      }

      this.loading = false;
      this.buttonText = "Enviar";
    },
  }));
});
