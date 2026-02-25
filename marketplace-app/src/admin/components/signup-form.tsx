import { useState } from "react";
import {
  Button,
  Container,
  Heading,
  Label,
  Text,
  toast,
} from "@medusajs/ui";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "2.75rem",
  padding: "0 1rem",
  borderRadius: "0.375rem",
  border: "1px solid #D1D5DB",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontSize: "0.875rem",
  outline: "none",
};

export default function SignUpForm() {
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");

  // Address fields
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [province, setProvince] = useState("");
  const [countryCode, setCountryCode] = useState("gr");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!storeName || !email || !password || !registrationCode) {
      toast.info("Error", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    // Address validation
    if (!address1 || !city || !postalCode || !countryCode) {
      toast.info("Error", {
        description: "Please fill in all required address fields.",
      });
      return;
    }

    try {
      const response = await fetch(`/stores/regular`, {
        body: JSON.stringify({
          store_name: storeName,
          email,
          password,
          registration_code: registrationCode,
          address: {
            address_1: address1,
            address_2: address2 || undefined,
            city,
            postal_code: postalCode,
            province: province || undefined,
            country_code: countryCode,
            phone: phone || undefined,
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = await response.json();
      if (data?.message === "Ok") {
        toast.success("Success", {
          description: "Store created successfully.",
        });

        // Reset form
        setStoreName("");
        setEmail("");
        setPassword("");
        setRegistrationCode("");
        setAddress1("");
        setAddress2("");
        setCity("");
        setPostalCode("");
        setProvince("");
        setCountryCode("gr");
        setPhone("");
      } else {
        toast.error("Error", {
          description: `${data.message}`,
        });
      }
    } catch (e) {
      console.error("Store create error", e);
      toast.error("Error", {
        description: "Unexpected error ocured",
      });
    }
  };

  return (
    <Container className="p-8 max-w-lg mx-auto">
      <Heading level="h2" className="mb-2">
        New store
      </Heading>
      <Text className="mb-6">Enter your store information</Text>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Info Section */}
        <div className="space-y-4">
          <Heading level="h3" className="text-sm font-medium" style={{ color: "#560B18" }}>
            Store Information
          </Heading>
          <div>
            <Label htmlFor="storeName">Store Name *</Label>
            <input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="My store"
              style={inputStyle}
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@mail.com"
              style={inputStyle}
            />
          </div>
          <div>
            <Label htmlFor="password">Password *</Label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              style={inputStyle}
            />
          </div>
          <div>
            <Label htmlFor="registrationCode">Registration Code *</Label>
            <input
              id="registrationCode"
              type="password"
              value={registrationCode}
              onChange={(e) => setRegistrationCode(e.target.value)}
              placeholder="Code provided by the platform"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4 pt-4 border-t border-ui-border-base">
          <Heading level="h3" className="text-sm font-medium" style={{ color: "#560B18" }}>
            Store Address
          </Heading>
          <div>
            <Label htmlFor="address1">Street Address *</Label>
            <input
              id="address1"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="123 Main Street"
              style={inputStyle}
            />
          </div>
          <div>
            <Label htmlFor="address2">Address Line 2</Label>
            <input
              id="address2"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Apt, Suite, Floor (optional)"
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Athens"
                style={inputStyle}
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code *</Label>
              <input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="10431"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">Province/State</Label>
              <input
                id="province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Attica (optional)"
                style={inputStyle}
              />
            </div>
            <div>
              <Label htmlFor="countryCode">Country Code *</Label>
              <input
                id="countryCode"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toLowerCase())}
                placeholder="gr"
                maxLength={2}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Business Phone</Label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+30 210 1234567 (optional)"
              style={inputStyle}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" className="w-full">
          Create Store
        </Button>
      </form>
    </Container>
  );
}
