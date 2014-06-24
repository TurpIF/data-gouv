print("Reading data...")
data <- read.csv("./Knime datasets/PolicesTEMP.csv", header = T,  stringsAsFactors = F)
epd <- read.csv("./Knime datasets/EffectifsPnGnGt.csv", header = T,  sep = "\t",  stringsAsFactors = F)
popD <- read.csv("./Knime datasets/PopParDept2013.csv", header = T,  sep = "\t",  stringsAsFactors = F)
popV <- read.csv("./Knime datasets/popfr2010.csv", header = T,  sep = "\t",  stringsAsFactors = F)
print("Sorting by type...")
PN <- data[data$Type == "PN",]
PM <- data[data$Type == "PM",]
G <- data[data$Type == "G",]
print(paste("Computing ratios... (",tot," occurrencies)",sep=""))
wai <- function(tot) {
	ratio <- cur/tot
	cur <<- cur + 1
	if (ratio >= last) {
		print(paste(last,"%"))
		last <<- last + 10.
	}
}
init <- function(tot) {
	tot <<- tot
	cur <<- 0
	last <<- 0
}
init(length(unique(data$noDept)))
ppD <- data.frame(matrix(vector(), 0, 4, dimnames=list(c(), c("Dept", "npPN", "npG", "npPM"))), stringsAsFactors=F)
for (i in data$noDept) {
	wai(tot)
	ppD[i,] <- c(i, nrow(PN[PN$noDept == i,]), nrow(G[G$noDept == i,]), nrow(PM[PM$noDept == i,]))
}
print(paste("Computing more ratios... (",tot," occurrencies)",sep=""))
init(length(unique(data$Ville)))
ppdD <- data.frame(matrix(vector(), 0, 2, dimnames=list(c(), c("Ville", "pPop"))), stringsAsFactors=F)
for (i in data$Ville) {
	wai(tot)
	ville <- popV[popV$com_nom == i, ]
	ppdD[i,] <- c(i, 1000*as.numeric(ville[, "pop_2010"])/popD[popD$Dept == ville$dep, "Pop"])
}
print(paste("Computing manpower... (",tot," occurrencies)",sep=""))
init(nrow(data))
final <- data.frame(matrix(vector(), 0, 9, dimnames=list(c(), c("long", "lat", "Type", "Adresse", "CP", "Ville", "nDept", "nReg", "Effectif"))), stringsAsFactors=F)
for (i in 1:nrow(data)) {
	wai(tot)
	poste <- data[i,]
	# 1/(nbPostesDuTypeDsVille)*(partPopVilleDept)*(EffectifDuTypeDsDept)
	effectif <- 0
	if (poste$Type == "G"){
		# *as.numeric(ppdD[ppdD$Ville == poste$Ville, "pPop"])
		tmp <- round(0.85*(1/as.numeric(ppD[ppD$Dept == poste$noDept, "npG"]))*(poste$gd2013)+1)
		effectif <- ifelse(is.na(tmp), sample(4:10,1), tmp)
	} else if (poste$Type == "PM") {
		effectif <- poste$Effectif
	} else if (poste$Type == "PN") {
		# 5*as.numeric(ppdD[ppdD$Ville == poste$Ville, "pPop"])
		tmp <- round((1/as.numeric(ppD[ppD$Dept == poste$noDept, "npPN"]))*(poste$pn2013)+1)
		effectif <- ifelse(is.na(tmp), sample(15:55,1), tmp)
	}
	final[i,] <- c(poste$Longitude,poste$Latitude,poste$Type,poste$Adresse,poste$CP,poste$Ville,poste$noDept,poste$noReg,effectif)
}
print("Writing output...")
write.csv(final, file = "./Knime datasets/effectif2.csv",row.names=F, na="")
print("Done.")

# library(maps)
# map("france")
# points(base$long,base$lat,cex=.1,col="red",pch=19)
# points(base$long,base$lat,cex=2*base$pop_2010/max(base$pop_2010),col="blue",pch=19)