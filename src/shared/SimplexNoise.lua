--//PLACEHOLDERS
local math_Sine = math.sin
local math_Sign = math.sign
local math_Floor = math.floor
local math_Clamp = math.clamp
local math_Noise = math.noise

local math_ACosine = math.acos
local table_Insert = table.insert
local table_Remove = table.remove
local table_Create = table.create
local table_Find = table.find

local Vector3_New = Vector3.new
local Vec3int16_New = Vector3int16.new
local Color3_New = Color3.new
local Instance_New = Instance.new

local CFrame_FromMatrix = CFrame.fromMatrix

local bit32_Extract = bit32.extract
local bit32_Band = bit32.band
local bit32_Lshift = bit32.lshift

--//CODE

local Handler = {
	__newindex = function() error("Attempt to assign new value to restricted table",2) end
}
Handler.__index = Handler

local SwapCount = 400
local RandomSeed = 0
local RandomSeedDefault = Random.new(tick())

local F2 = 0.5*(math.sqrt(3.0)-1.0);
local G2 = (3.0-math.sqrt(3.0))/6.0;
local F3 = 1/3
local G3 = 1/6

local Grad3 = {
	[0] = Vec3int16_New(1,1,0),
	Vec3int16_New(-1,1,0),
	Vec3int16_New(1,-1,0),
	Vec3int16_New(-1,-1,0),
	Vec3int16_New(1,0,1),
	Vec3int16_New(-1,0,1),
	Vec3int16_New(1,0,-1),
	Vec3int16_New(-1,0,-1),
	Vec3int16_New(0,1,1),
	Vec3int16_New(0,-1,1),
	Vec3int16_New(0,1,-1),
	Vec3int16_New(0,-1,-1)
}

local DefaultValues = {
	Initialized = false,
	Seed = false,
	RandomObject = false,
	BitOrder = false
	
}

local StaticInitTables = {
	RandMap = 512,
	RandMapMod12 = 512
}


function Handler.New(seed)
	local Obj = {}
	setmetatable(Obj,Handler)
	for i,v in pairs(DefaultValues) do
		rawset(Obj,i,v)
	end
	Obj.Seed = seed or RandomSeedDefault:NextInteger(-math.huge,math.huge)
	Obj.RandomObject = Random.new(Obj.Seed)
	for i,v in pairs(StaticInitTables) do
		rawset(Obj,i,table_Create(v))
	end
	return Obj
end

local function dot3(GradVec,x1,y1,z1)
	return (GradVec.X*x1 + GradVec.Y*y1 + GradVec.Z*z1)
end

local function dot2(Gradvec,x1,y1)
	return (Gradvec.X * x1 + Gradvec.Y * y1)
end

function Handler:Get2DValue(x,y)
	local RMap = self.RandMap
	local RMap12 = self.RandMapMod12
	
	local s = (x+y)*F2
	local i,j = math_Floor(x + s),math_Floor(y + s)
	local sp = (i + j)*G2
	local ip,jp = i - sp,j - sp
	local u,v = x - ip, y - jp -- x0,y0
	
	local i1,j1
	
	if u > v then
		i1,j1 = 1,0
	else
		i1,j1 = 0,1
	end
	
	local x1,y1 = u - i1 + G2,v - j1 + G2
	local x2,y2 = u - 1 + G2*2,v - 1 + G2*2
	
	local ii = i % 256
	local jj = j % 256
	
	local gi0 = RMap12[ii + RMap[jj]]
	local gi1 = RMap12[ii + i1 + RMap[jj + j1]]
	local gi2 = RMap12[ii + 1 + RMap[jj + 1]]
	
	local u0,u1,u2
	local t0 = 0.5 - u*u - v*v
	if t0 < 0 then u0 = 0 else
		t0 *= t0
		u0 = t0*t0 * dot2(Grad3[gi0],u,v)
	end
	local t1 = 0.5 - x1*x1 - y1*y1
	if t1 < 0 then u1 = 0 else
		t1 *= t1
		u1 = t1*t1 * dot2(Grad3[gi1],x1,y1)
	end
	local t2 = 0.5 - x2*x2 - y2*y2
	if t2 < 0 then u2 = 0 else
		t2 *= t2
		u2 = t2*t2 * dot2(Grad3[gi2],x2,y2)
	end
	
	return 70 * (u0 + u1 + u2)
end

function Handler:Get3DValue(x,y,z)
	local RMap = self.RandMap
	local RMap12 = self.RandMapMod12
	
	local s = (x + y + z)*F3
	local i,j,k = math_Floor(x+s),math_Floor(y+s),math_Floor(z+s)
	local sp = (i+j+k)*G3
	local up,vp,wp = i-sp,j-sp,k-sp
	local u,v,w = x-up,y-vp,z-wp -- x0,y0,z0
	
	local i1,j1,k1
	local i2,j2,k2
	
	if v < u then
		if w < v then
			i1,j1,k1,i2,j2,k2 = 1,0,0,1,1,0 --// X Y Z order
		elseif u >= w then 
			i1,j1,k1,i2,j2,k2 = 1,0,0,1,0,1 --// X Z Y order
		else
			i1,j1,k1,i2,j2,k2 = 0,0,1,1,0,1 --// z X Y order
		end
    else -- x0<y0
		if v < w then
			i1,j1,k1,i2,j2,k2 = 0,0,1,0,1,1 --// Z Y X order
		elseif(u<w) then
			i1,j1,k1,i2,j2,k2 = 0,1,0,0,1,1 --// Y Z X order
		else
			i1,j1,k1,i2,j2,k2 = 0,1,0,1,1,0 --// Y X Z order
		end
    end

	local x1,y1,z1 = u - i1+G3,v - j1+G3,w - k1+G3
	local x2,y2,z2 = u - i2+2*G3,v - j2+2*G3,w - k2+2*G3
	local x3,y3,z3 = u - .5, v - .5, w - .5
	
	local ii = i % 256
	local jj = j % 256
	local kk = k % 256
	
	local gi0,gi1,gi2,gi3
	gi0 = RMap12[ii + RMap[jj + RMap[kk]]]
	gi1 = RMap12[ii + i1 + RMap[jj + j1 + RMap[kk + k1]]]
	gi2 = RMap12[ii + i2 + RMap[jj + j2 + RMap[kk + k2]]]
	gi3 = RMap12[ii + 1 + RMap[jj + 1 + RMap[kk + 1]]]
	
	local u0,u1,u2,u3
	local t0,t1,t2,t3
	t0 = 0.6 - u*u - v*v - w*w
	if t0 <= 0 then u0 = 0 else
		t0 *= t0
		u0 = t0*t0 * dot3(Grad3[gi0],u,v,w)
	end
	t1 = 0.6 - x1*x1 - y1*y1 - z1*z1
	if t1 <= 0 then u1 = 0 else
		t1 *= t1
		u1 = t1*t1 * dot3(Grad3[gi1],x1,y1,z1)
	end
	t2 = 0.6 - x2*x2 - y2*y2 - z2*z2
	if t2 <= 0 then u2 = 0 else
		t2 *= t2
		u2 = t2*t2 * dot3(Grad3[gi2],x2,y2,z2)
	end
	t3 = 0.6 - x3*x3 - y3*y3 - z3*z3
	if t3 <= 0 then u3 = 0 else
		t3 *= t3 
		u3 = t3*t3 * dot3(Grad3[gi3],x3,y3,z3)
	end
	local Val = 32*(u0+u1+u2+u3)
	return  Val
end


function Handler:Init()
	if not self.Initialized then
		self.Initialized = true
		for i = 0,511 do
			self.RandMap[i] = bit32_Band(i,255)
		end
		
		for i = 1,SwapCount do
			local fromInd = self.RandomObject:NextInteger(0,511)
			local toInd = self.RandomObject:NextInteger(0,511)
			local Temp = self.RandMap[fromInd]
			self.RandMap[fromInd] = self.RandMap[toInd]
			self.RandMap[toInd] = Temp
		end
		
		for i = 0,511 do
			self.RandMap[i] = self.RandMap[bit32_Band(i,255)]
			self.RandMapMod12[i] = self.RandMap[i] % 12
		end
	end
end

return Handler.New









--[[ GRADIENT VECTOR CALCULATIONS 

BitPatterns = {
	0x15,
	0x38,
	0x32,
	0x2c,
	0x0d,
	0x13,
	0x07,
	0x2a
}

function Handler:BitPat(i,j,k,B)
	local patternIndex = 
		4 * bit32_Extract(i,B,0) + 
		2 * bit32_Extract(j,B,0) + 
		bit32_Extract(k,B,0)
	return BitPatterns[patternIndex]
end

function Handler:SetOrder(i,j,k)
	local IndexValue = 
		self:BitPat(i,j,k,0)
		+ self:BitPat(i,j,k,1)
		+ self:BitPat(i,j,k,2)
		+ self:BitPat(i,j,k,3)
		+ self:BitPat(i,j,k,4)
		+ self:BitPat(i,j,k,5)
		+ self:BitPat(i,j,k,6)
		+ self:BitPat(i,j,k,7)
	
	local l1,l2,l3 = bit32_Extract(IndexValue,62,1), bit32_Extract(IndexValue,63,1), bit32_Extract(IndexValue,64,1)
	local h1,h2,h3 = bit32_Extract(IndexValue,59,1), bit32_Extract(IndexValue,60,1), bit32_Extract(IndexValue,61,1)
	
	local Order = {0,0,0}
	
	if l2 ==0 and l3 == 0 then
		Order[1] = 1
		Order[2] = 2
		Order[3] = 3
	elseif l1 == 0 then
		Order[3] = 0
		local IndShift = (bit32_Lshift(l2,1) + l3) % 3
		Order[1] = IndShift + 1
		Order[2] = IndShift + 2
	else
		Order[2] = 0
		local IndShift = (bit32_Lshift(l2,1) + l3) % 3
		Order[1] = IndShift + 1
		Order[3] = IndShift
	end
	
	if h1 == h3 then
		Order[1] *= -1
	end
	if h1 == h2 then
		Order[2] *= -1
	end
	
	if h1 == (bit32_Band(h2,h3)) then
		Order[3] *= -1
	end
	
	self.BitOrder = Order
end

function Handler:GetPseudoRandomGradient(x,y,z)
	
end
]]