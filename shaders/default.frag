#version 330 core

out vec4 fragColor;

in vec2 fragCoord;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform vec3 iPlayer;

float sdSphere(vec3 p, float s) {
	return length(p) - s;
}

float sdBox(vec3 p, vec3 b) {
	vec3 q = abs(p) - b;
	return length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0);
}

float smin(float a, float b, float k) {
	float h = max(k - abs(a - b), 0.0) / k;
	return min(a, b) - h*h*h*k*(1.0/6.0);
}

float sdHexPrism( vec3 p, vec2 h )
{
	const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
	p = abs(p);
	p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
	vec2 d = vec2(
	    length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
	    p.z-h.y );
	return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdCappedCylinder( vec3 p, float h, float r )
{
	vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
	return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdCappedCone( vec3 p, vec3 a, vec3 b, float ra, float rb )
{
	float rba  = rb-ra;
	float baba = dot(b-a,b-a);
	float papa = dot(p-a,p-a);
	float paba = dot(p-a,b-a)/baba;
	float x = sqrt( papa - paba*paba*baba );
	float cax = max(0.0,x-((paba<0.5)?ra:rb));
	float cay = abs(paba-0.5)-0.5;
	float k = rba*rba + baba;
	float f = clamp( (rba*(x-ra)+paba*baba)/k, 0.0, 1.0 );
	float cbx = x-ra - f*rba;
	float cby = paba - f;
	float s = (cbx<0.0 && cay<0.0) ? -1.0 : 1.0;
	return s*sqrt( min(cax*cax + cay*cay*baba,
        			   cbx*cbx + cby*cby*baba) );
}

mat2 rot2D(float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return mat2(c, -s, s, c);
}

vec2 minId(vec2 a, vec2 b) {
	return (a.x < b.x) ? a : b;
}

vec2 wing(vec3 p, vec3 coords) {
	vec3 cone1Pos = vec3(0, 0, 0);
	vec3 q = p - cone1Pos - coords;
	q.xy *= rot2D(3.141592 / 2);
	vec2 cone1 = vec2(sdCappedCone(q, vec3(0, -.5, 0), vec3(0, .5, 0), .2, .3), 1);

	vec3 cone2Pos = vec3(-1, 0, 0);
	q = p - cone2Pos - coords;
	q.xy *= rot2D(3.141592 / 2);
	vec2 cone2 = vec2(sdCappedCone(q, vec3(0, -.10, 0), vec3(0, .5, 0), .25, .2), 1);

	vec3 prismPos = vec3(-1.2, 0, 0);
	q = p - prismPos - coords;
	q.xz *= rot2D(3.141592 / 2);
	vec2 prism = vec2(sdHexPrism(q, vec2(3, 0.1)), 1);

	return minId(cone1, minId(cone2, prism));
}

vec2 TIE(vec3 p, vec3 coords) {
	vec3 spherePos = vec3(0, 0, 0);
	vec2 sphere = vec2(sdSphere(p - spherePos - coords, 1), 1);

	vec3 wing1Pos = vec3(-1.45, 0, 0);
	vec2 wing1 = wing(p - coords, wing1Pos);

	vec3 wing2Pos = vec3(-1.45, 0, 0);
	vec3 q = p - coords;
	q.xy *= rot2D(3.141592);
	vec2 wing2 = wing(q, wing2Pos);

	return minId(sphere, minId(wing1, wing2));
}

vec2 map(vec3 p) {
	vec3 TIE_coords = vec3(sin(iTime) * 3, 3, 0);

	vec3 q = p;
	q.xy *= rot2D(-cos(iTime) * .2);

	vec2 TIE = TIE(q, TIE_coords);

	vec2 ground = vec2(p.y + .75, 3.);

	return TIE;
}

vec3 getNormal(vec3 p) {
	vec2 e = vec2(.0001, 0.0);
	vec3 n = vec3(map(p).x) - vec3(map(p - e.xyy).x, map(p - e.yxy).x, map(p - e.yyx).x);
	return normalize(n);
}

vec3 getMaterial(vec3 p, float id) {
	vec3 m;
	switch (int(id)) {
		case 1:
			m = vec3(.9, .9, 0.);
			break;
		case 2:
			m = vec3(0., .5, .5);
			break;
		case 3:
			m = vec3(1, 1, 1);
			break;
	}
	return m;
}

vec2 rayMarch(vec3 ro, vec3 rd) {
	vec2 object;

	for (int i = 0; i < 80; i++) {
		vec3 p = ro + rd * object.x; // position allong the ray

		vec2 hit = map(p);
		object.x += hit.x;
		object.y = hit.y;

		if (object.x < .001 || object.x > 100) break;
	}

	return object;
}

float getSoftShadow(vec3 p, vec3 lightPos) {
	float res = 1;
	float dist = .01;
	float lightSize = .03;
	for (int i = 0; i < 200; i++) {
		float hit = map(p + lightPos * dist).x;
		res = min(res, hit / (dist * lightSize));
		dist += hit;
		if (hit < .0001 || dist > 60) break;
	}
	return clamp(res, 0, 1);
}

float getAmbiantOcclusion(vec3 p, vec3 normal) {
	float occ = 0;
	float weight = 1;
	for (int i = 0; i < 8; i++) {
		float len = .01 + .02 * float(i * i);
		float dist = map(p + normal * len).x;
		occ += (len - dist) * weight;
		weight *= .85;
	}

	return 1 - clamp(.6 * occ, 0, 1);
}

vec3 getLight(vec3 p, vec3 rd, vec3 color) {
	vec3 lightPos = vec3(20, 40, 10);
	vec3 L = normalize(lightPos - p);
	vec3 N = getNormal(p);
	vec3 V = -rd;
	vec3 R = reflect(-L, N);

	vec3 specColor = vec3(.5);
	vec3 specular = specColor * pow(clamp(dot(R, V), 0, 1), 10);
	vec3 diffuse = color * clamp(dot(L, N), 0., 1.);
	vec3 ambiant = color * .05;
	vec3 fresnel = .15 * color * pow(1 + dot(rd, N), 3);

	// shadows
	float shadow = getSoftShadow(p + N * .02, normalize(lightPos));

	// occ
	float occ = getAmbiantOcclusion(p, N);

	// back
	vec3 back = .05 * color * clamp(dot(N, -L), 0, 1);

	return (back + ambiant + fresnel) * occ + (specular * occ + diffuse) * shadow;
}
void main()
{
	vec2 uv = vec2(fragCoord.x * iResolution.x / iResolution.y, fragCoord.y);
	vec2 m = iMouse;

	// init
	vec3 ro = vec3(0, 0, -3) + iPlayer; // ray origin
	vec3 rd = normalize(vec3(uv, 1));   // ray direction

	// Camera rotations
	//ro.yz *= rot2D(-m.y);
	rd.yz *= rot2D(-m.y);

	//ro.xz *= rot2D(-m.x);
	rd.xz *= rot2D(-m.x);

	// raymarching
	vec2 object = rayMarch(ro, rd);

	// Coloring
	vec3 col;
	vec3 background = vec3(0, 0, 0);
	if (object.x < 100) {
		vec3 p = ro + object.x * rd;
		vec3 m = getMaterial(p, object.y);
		col = getLight(p, rd, m);

		// fog
		col = mix(col, background, 1 - exp(-.0008 * object.x * object.x));
	} else {
		col = background - max(0.95 * rd.y, 0);
	}

	// Gamma correction
	col = pow(col, vec3(0.4545));
    fragColor = vec4(col, 1);
}